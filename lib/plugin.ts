///<reference path="../node_modules/postcss/postcss.d.ts" />
import postcss from 'postcss';
const _ = require('lodash');

const plugin = 'postcss-font-pack';
const errorContext = { plugin };
const errorPrefix = `[${plugin}]`;

const directivePattern = new RegExp(`^${plugin}: ([a-z-]+)$`);
const fontValuePattern = /^(?:\s*(.+)\s+)?(\S+(?:\/\S+)?)\s+(.+)\s*$/;

export default postcss.plugin<PostCssFontPack.Options>('postcss-font-pack', options => {

	return root => {
		if (!options) {
			throw new Error(`${errorPrefix} missing required configuration`);
		}

		const packs = options.packs;
		if (!packs) {
			throw new Error(`${errorPrefix} missing required option: packs`);
		}

		const keys = Object.keys(packs);
		if (!keys.length) {
			throw new Error(`${errorPrefix} packs option has no keys`);
		}

		const lookup = {};
		keys.forEach(key => {
			const pack = packs[key];
			if (!pack.family) {
				throw new Error(`${errorPrefix} missing required pack.family`);
			}
			if (!pack.family.length) {
				throw new Error(`${errorPrefix} pack.family is empty`);
			}
			const family = {};
			family[`family:${key}`] = pack.family.join(', ');
			if (!pack.propGroups || !pack.propGroups.length) {
				lookup[key] = [family];
				return;
			}
			lookup[key] = pack.propGroups.map(prop => {
				const props = {};
				Object.keys(prop).forEach(p => {
					const v = prop[p];
					switch (typeof v) {
						case 'string':
						case 'number':
							props[`${p}:${v}`] = v;
							props[`reverse:${v}`] = p;
							break;
						default:
							if (!Array.isArray(v)) {
								throw new TypeError(`${errorPrefix} prop value expects string, number or array`);
							}
							props[`${p}:${v[0]}`] = v[1];
							props[`reverse:${v[0]}`] = p;
					}
				});
				return <any>_.assign({}, family, props);
			});
		});

		let start: {
			line: number;
			column: number;
		} = null;
		const ignoreRanges: {
			start: typeof start;
			end: typeof start;
		}[] = [];
		const ignoreNexts: (typeof start)[] = [];
		root.walkComments(comment => {
			const m = comment.text.match(directivePattern);
			const directive = m && m[1];
			if (!directive) {
				return;
			}
			switch (directive) {
				case 'start-ignore':
					if (start !== null) {
						throw comment.error(
							'start-ignore already defined',
							errorContext
						);
					}
					start = comment.source.end;
					break;
				case 'end-ignore':
					if (start === null) {
						throw comment.error(
							'start-ignore not defined',
							errorContext
						);
					}
					ignoreRanges.push({
						start,
						end: comment.source.start
					});
					start = null;
					break;
				case 'ignore-next':
					if (start !== null) {
						throw comment.error(
							'Unnecessary ignore-next after start-ignore',
							errorContext
						);
					}
					ignoreNexts.push(comment.source.end);
					break;
				default:
					throw comment.error(
						`Unsupported directive: ${directive}`,
						errorContext
					);
			}
		});

		function isWithinIgnoreRange(decl: postcss.Declaration) {
			if (
				ignoreNexts.length &&
				isSourceAfterOther(decl.source.start, ignoreNexts[0])
				) {
				ignoreNexts.shift();
				return true;
			}

			for (const range of ignoreRanges) {
				if (
					isSourceAfterOther(decl.source.start, range.start) &&
					isSourceAfterOther(range.end, decl.source.end)
					) {
					return true;
				}
			}

			return false;

			function isSourceAfterOther(source: typeof start, other: typeof start) {
				if (source.line < other.line) {
					return false;
				}
				if (source.line > other.line) {
					return true;
				}
				return source.column >= other.column;
			}
		}

		root.walkRules(rule => {
			const props: any = {};
			let filteredPacks = [];
			let fontDeclarationCount = 0;
			let isSizeProvided = false;

			function resolveDeclaration(decl: postcss.Declaration) {

				if (isWithinIgnoreRange(decl)) {
					return;
				}

				function validatePackFound() {
					if (!filteredPacks || !filteredPacks.length) {
						throw decl.error('pack not found', errorContext);
					}
				}

				if (decl.prop === 'font') {
					const parts = decl.value.match(fontValuePattern);
					if (!parts) {
						throw decl.error(
							'font property requires size and family',
							errorContext
						);
					}
					fontDeclarationCount += parts.length - 1;
					isSizeProvided = true;
					props.font = _.omit(
						{
							props: parts[1],
							sizeLineHeight: parts[2],
							family: parts[3]
						},
						_.isUndefined
					);
					filteredPacks = lookup[props.font.family];

					if (props.font.props) {
						props.font.props.split(/\s+/).forEach(val => {
							filteredPacks = _.filter(filteredPacks, o => {
								const prop = o[`reverse:${val}`];
								if (_.isUndefined(prop)) {
									return false;
								}
								props.font[prop] = val;
								return true;
							});
						});
						delete props.font.props;
					}
					validatePackFound();
				} else {
					fontDeclarationCount++;
					const prop = decl.prop.substr(5);
					if (prop === 'family') {
						filteredPacks = lookup[decl.value];
					} else {
						filteredPacks = _.filter(filteredPacks, o => {
							return o.hasOwnProperty(`${prop}:${decl.value}`);
						});
					}
					validatePackFound();
					props[prop] = decl.value;
				}
			}

			rule.walkDecls(/^font(-family)?$/, resolveDeclaration);
			rule.walkDecls(/^font-(weight|style|variant|stretch)$/, resolveDeclaration);
			rule.walkDecls('font-size', decl => {
				if (isWithinIgnoreRange(decl)) {
					return;
				}
				isSizeProvided = true;
				if (++fontDeclarationCount === 1) {
					throw new Error(`${errorPrefix} font-size missing required family`);
				}
			});

			if (fontDeclarationCount === 0) {
				return;
			}

			if (options.requireSize && !isSizeProvided) {
				throw new Error(`${errorPrefix} missing required font-size`);
			}

			filteredPacks = _.reject(filteredPacks, p2 => {
				let isMatch = true;
				_.forEach(Object.keys(p2), prop => {
					if (_.startsWith(prop, 'reverse:')) {
						return true;
					}
					const [packProp, packValue] = prop.split(':');
					let propValue = props[packProp];
					if (_.isUndefined(propValue) && props.font) {
						propValue = props.font[packProp];
					}
					if (packValue !== propValue) {
						isMatch = false;
						return false;
					}
					return true;
				});
				return !isMatch;
			});

			// ReSharper disable once QualifiedExpressionIsNull
			if (filteredPacks.length > 1) {
				throw new Error(`${errorPrefix} more than one pack found`);
			}

			if (filteredPacks.length === 0) {
				throw new Error(`${errorPrefix} pack not found`);
			}

			// passes validation
			const pack = filteredPacks[0];
			const font = props.font;
			if (font) {
				rule.walkDecls('font', decl => {
					const sizeFamily = [
						font.sizeLineHeight,
						pack[`family:${font.family}`]
					];
					delete font.sizeLineHeight;
					delete font.family;
					decl.value = _.union(
						Object.keys(font).map(prop => {
							return pack[`${prop}:${font[prop]}`];
						}),
						sizeFamily
					).join(' ');
				});
				delete props.font;
			}
			Object.keys(props).forEach(prop => {
				rule.walkDecls(`font-${prop}`, decl => {
					decl.value = pack[`${prop}:${decl.value}`];
				});
			});
		});
	};
});

export module PostCssFontPack {
	/**
	 * Plugin options.
	 */
	export interface Options {
		/**
		 * When true, an error will be thrown if you have a rule with one or more
		 * font declarations, but without a font size.
		 */
		requireSize?: boolean;
		/**
		 * Supported font packs.
		 */
		packs: {[key: string]: Pack};
	}
	export interface Pack {
		family: string[];
		propGroups?: PropGroup[];
	}
	/**
	 * A collection of supported properties for the associated font family.
	 */
	export interface PropGroup {
		weight?: string|number|(string|number)[];
		style?: string|string[];
		variant?: string|string[];
		stretch?: string|string[];
	}
}
