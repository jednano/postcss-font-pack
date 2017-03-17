import * as postcss from 'postcss';
const _ = require('lodash');

const plugin = 'postcss-font-pack';
const errorContext = { plugin };
const errorPrefix = `[${plugin}]`;
const sizeLineHeightPattern = /^\S+(?:\/\S+)?$/;
const directivePattern = new RegExp(`^${plugin}: ([a-z-]+)$`);

const PostCssFontPack = postcss.plugin<PostCssFontPack.Options>('postcss-font-pack', options => {

	return root => {
		if (!options) {
			throw new Error(`${errorPrefix} missing required configuration`);
		}

		const packs = options.packs;
		if (!packs) {
			throw new Error(`${errorPrefix} missing required option: packs`);
		}

		if (!Object.keys(packs).length) {
			throw new Error(`${errorPrefix} packs option has no keys`);
		}

		const lookup = buildLookupTable(packs);
		const zonesToIgnore = findZonesToIgnore(root);

		function isWithinIgnoreRange(decl: postcss.Declaration) {
			if (
				zonesToIgnore.nexts.length &&
				isPositionAfterOther(decl.source.start, zonesToIgnore.nexts[0])
			) {
				zonesToIgnore.nexts.shift();
				return true;
			}

			for (const range of zonesToIgnore.ranges) {
				if (
					isPositionAfterOther(decl.source.start, range.start) &&
					isPositionAfterOther(range.end, decl.source.end)
				) {
					return true;
				}
			}

			return false;

			function isPositionAfterOther(
				position: PostCssFontPack.Position,
				other: PostCssFontPack.Position
			) {
				if (position.line < other.line) {
					return false;
				}
				if (position.line > other.line) {
					return true;
				}
				return position.column >= other.column;
			}
		}

		root.walkRules(rule => {
			const props: any = {};
			let filteredPacks: PostCssFontPack.Hash<string>[] = [];
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
					const values = postcss.list.space(decl.value);
					fontDeclarationCount += values.length;
					const family = values.pop();
					const sizeLineHeight = values.pop();
					props.font = { family, sizeLineHeight, values };
					if (
						_.isUndefined(family) ||
						_.isUndefined(sizeLineHeight) ||
						!sizeLineHeightPattern.test(sizeLineHeight)
					) {
						throw decl.error(
							'font property requires size and family',
							errorContext
						);
					}
					isSizeProvided = true;
					filteredPacks = lookup[family];

					values.forEach(val => {
						filteredPacks = _.filter(filteredPacks, (o: any) => {
							const prop = o[`reverse:${val}`];
							if (_.isUndefined(prop)) {
								return false;
							}
							props.font[prop] = val;
							return true;
						});
					});
					delete props.font.values;
					validatePackFound();
				} else {
					fontDeclarationCount++;
					const prop = decl.prop.substr(5);
					if (prop === 'family') {
						filteredPacks = lookup[decl.value];
					} else {
						filteredPacks = _.filter(filteredPacks, (o: any) => {
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

			filteredPacks = _.reject(filteredPacks, (p2: any) => {
				let isMatch = true;
				_.forEach(Object.keys(p2), (prop: any) => {
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

namespace PostCssFontPack {
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
		packs: Packs;
	}
	export interface Packs {
		[slug: string]: Pack;
	}
	export interface Pack {
		family: string[];
		propGroups?: PropGroup[];
	}
	/**
	 * A collection of supported properties for the associated font family.
	 */
	export interface PropGroup {
		[index: string]: any;
		weight?: string|number|(string|number)[];
		style?: string|string[];
		variant?: string|string[];
		stretch?: string|string[];
	}
	export interface Range {
		start: Position;
		end: Position;
	}
	export interface Position {
		line: number;
		column: number;
	}
	export interface Lookup {
		[slug: string]: Hash<string>[];
	}
	export interface Hash<T> {
		[key: string]: T;
	}
}

function buildLookupTable(packs: PostCssFontPack.Packs) {
	const lookup: PostCssFontPack.Lookup = {};
	Object.keys(packs).forEach(slug => {
		const pack = packs[slug];
		if (!pack.family) {
			throw new Error(`${errorPrefix} missing required pack.family`);
		}
		if (!pack.family.length) {
			throw new Error(`${errorPrefix} pack.family is empty`);
		}
		const family: PostCssFontPack.Hash<string> = {
			[`family:${slug}`]: pack.family.join(', ')
		};
		if (!pack.propGroups || !pack.propGroups.length) {
			lookup[slug] = [family];
			return;
		}
		lookup[slug] = pack.propGroups.map(prop => {
			const props: { [key: string]: string; } = {};
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
			return _.assign({}, family, props);
		});
	});
	return lookup;
}

function findZonesToIgnore(root: postcss.Root) {
	let start: PostCssFontPack.Position = null;
	const ranges: PostCssFontPack.Range[] = [];
	const nexts: PostCssFontPack.Position[] = [];
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
				ranges.push({ start, end: comment.source.start });
				start = null;
				break;
			case 'ignore-next':
				if (start !== null) {
					throw comment.error(
						'Unnecessary ignore-next after start-ignore',
						errorContext
						);
				}
				nexts.push(comment.source.end);
				break;
			default:
				throw comment.error(
					`Unsupported directive: ${directive}`,
					errorContext
				);
		}
	});
	return { ranges, nexts };
}

export = PostCssFontPack;
