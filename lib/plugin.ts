///<reference path="../typings/node/node.d.ts" />
var postcss = require('postcss');
var _ = require('lodash');

var PLUGIN_NAME = 'postcss-font-pack';
var ERROR_CONTEXT = { plugin: PLUGIN_NAME };
var ERROR_PREFIX = `[${PLUGIN_NAME}]`;

var FONT_VALUE_PATTERN = /^(?:\s*(.+)\s+)?(\S+(?:\/\S+)?)\s+(.+)\s*$/;

// ReSharper disable once UnusedLocals
// ReSharper disable RedundantQualifier
var PostCssFontPack: (options: PostCssFontPack.Options) => void = postcss.plugin(
	'postcss-font-pack',
	(options: PostCssFontPack.Options) => {
		// ReSharper enable RedundantQualifier
		return node => {
			if (!options) {
				throw new Error(`${ERROR_PREFIX} missing required configuration`);
			}
			var packs = options.packs;
			if (!packs) {
				throw new Error(`${ERROR_PREFIX} missing required option: packs`);
			}
			var keys = Object.keys(packs);
			if (!keys.length) {
				throw new Error(`${ERROR_PREFIX} packs option has no keys`);
			}

			var lookup = {};
			keys.forEach(key => {
				var pack = packs[key];
				if (!pack.family) {
					throw new Error(`${ERROR_PREFIX} missing required pack.family`);
				}
				if (!pack.family.length) {
					throw new Error(`${ERROR_PREFIX} pack.family is empty`);
				}
				var family = {};
				family[`family:${key}`] = pack.family.join(', ');
				if (!pack.propGroups || !pack.propGroups.length) {
					lookup[key] = [family];
					return;
				}
				lookup[key] = pack.propGroups.map(prop => {
					var props = {};
					Object.keys(prop).forEach(p => {
						var v = prop[p];
						switch (typeof v) {
							case 'string':
							case 'number':
								props[`${p}:${v}`] = v;
								props[`reverse:${v}`] = p;
								break;
							default:
								if (!Array.isArray(v)) {
									throw new TypeError(`${ERROR_PREFIX} prop value expects string, number or array`);
								}
								props[`${p}:${v[0]}`] = v[1];
								props[`reverse:${v[0]}`] = p;
						}
					});
					return _.assign({}, family, props);
				});
			});

			node.eachRule(rule => {
				var filteredPacks: any[];
				var props: any = {};

				function resolveDeclaration(decl: any) {
					function validatePackFound() {
						if (!filteredPacks || !filteredPacks.length) {
							throw decl.error('pack not found', ERROR_CONTEXT);
						}
					}

					if (decl.prop === 'font') {
						var parts = decl.value.match(FONT_VALUE_PATTERN);
						if (!parts) {
							throw decl.error('font property requires size and family');
						}
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
									var prop = o[`reverse:${val}`];
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
						var prop = decl.prop.substr(5);
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

				rule.eachDecl(/^font(-family)?$/, resolveDeclaration);
				rule.eachDecl(/^font-(weight|style|variant|stretch)$/, resolveDeclaration);

				filteredPacks = _.reject(filteredPacks, p2 => {
					var isMatch = true;
					_.forEach(Object.keys(p2), prop => {
						if (_.startsWith(prop, 'reverse:')) {
							return true;
						}
						var parts = prop.split(':');
						prop = parts[0];
						var packValue = parts[1];
						var propValue = props[prop];
						if (_.isUndefined(propValue) && props.font) {
							propValue = props.font[prop];
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
					throw new Error(`${ERROR_PREFIX} more than one pack found`);
				}

				if (filteredPacks.length === 0) {
					throw new Error(`${ERROR_PREFIX} pack not found`);
				}

				// passes validation
				var pack = filteredPacks[0];
				var font = props.font;
				if (font) {
					rule.eachDecl('font', decl => {
						var sizeFamily = [
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
					rule.eachDecl(`font-${prop}`, decl => {
						decl.value = pack[`${prop}:${decl.value}`];
					});
				});
			});
		};
	}
);

module PostCssFontPack {
	/**
	 * Plugin options.
	 */
	export interface Options {
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

export = PostCssFontPack;
