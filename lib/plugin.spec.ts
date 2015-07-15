///<reference path='../typings/tsd.d.ts'/>
import chai = require('chai');
import plugin = require('./plugin');
var postcss = require('postcss');

var expect = chai.expect;

var PLUGIN_NAME = 'postcss-font-pack';
var ERROR_PREFIX = `[${PLUGIN_NAME}]`;

// ReSharper disable WrongExpressionStatement
describe('postcss-font-pack plugin', () => {

	it('throws if configuration options are not provided', () => {
		var fn = () => {
			check(void(0), '');
		};
		expect(fn).to.throw(`${ERROR_PREFIX} missing required configuration`);
	});

	it('throws if packs option is not provided', () => {
		var fn = () => {
			check(<any>{}, '');
		};
		expect(fn).to.throw(`${ERROR_PREFIX} missing required option: packs`);
	});

	it('throws if packs option has no keys', () => {
		var fn = () => {
			check({ packs: {} }, '');
		};
		expect(fn).to.throw(`${ERROR_PREFIX} packs option has no keys`);
	});

	it('throws if a pack family is not specified', () => {
		var fn = () => {
			check({ packs: { a: <any>{ propGroups: <any>[] } } }, '');
		};
		expect(fn).to.throw(`${ERROR_PREFIX} missing required pack.family`);
	});

	it('throws if a pack family is empty', () => {
		var fn = () => {
			check({ packs: { a: { family: <any>[] } } }, '');
		};
		expect(fn).to.throw(`${ERROR_PREFIX} pack.family is empty`);
	});

	it('throws if prop value is null', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto'],
							propGroups: [
								{
									weight: null
								}
							]
						}
					}
				},
				''
			);
		};
		expect(fn).to.throw(TypeError, `${ERROR_PREFIX} prop value expects string, number or array`);
	});

	it('throws if font declaration is missing a size', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto']
						}
					}
				},
				'body{font:roboto}'
			);
		};
		expect(fn).to.throw(/font property requires size and family/);
	});

	it('throws if font declaration is missing a family', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto']
						}
					}
				},
				'body{font:0}'
			);
		};
		expect(fn).to.throw(/font property requires size and family/);
	});

	it('throws if no pack is found for font-family property', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto']
						}
					}
				},
				'body{font-family:foo}'
			);
		};
		expect(fn).to.throw(/pack not found/);
	});

	it('throws if more than one pack is found', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto'],
							propGroups: [
								{
									weight: ['bold', 700]
								},
								{
									weight: ['bold', 600]
								}
							]
						}
					}
				},
				'body{font:bold 0 roboto}'
			);
		};
		expect(fn).to.throw(`${ERROR_PREFIX} more than one pack found`);
	});

	it('throws if fallbacks are provided', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto', 'Arial', 'sans-serif']
						}
					}
				},
				'body{font:0 roboto, Arial, sans-serif}'
			);
		};
		expect(fn).to.throw(/pack not found/);
	});

	it('resolves a font-family declaration', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif']
					}
				}
			},
			'body{font-family:roboto}',
			'body{font-family:Roboto, Arial, sans-serif}'
		);
	});

	it('resolves a font-weight declaration', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{
								weight: 300
							}
						]
					}
				}
			},
			'body{font-family:roboto;font-weight:300}',
			'body{font-family:Roboto, Arial, sans-serif;font-weight:300}'
		);
	});

	it('resolves a font-weight declaration with an alias',() => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{
								weight: ['light', 300]
							}
						]
					}
				}
			},
			'body{font-family:roboto;font-weight:light}',
			'body{font-family:Roboto, Arial, sans-serif;font-weight:300}'
			);
	});

	it('resolves a font-style declaration', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{
								style: 'italic'
							}
						]
					}
				}
			},
			'body{font-family:roboto;font-style:italic}',
			'body{font-family:Roboto, Arial, sans-serif;font-style:italic}'
		);
	});

	it('resolves a font-variant declaration', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{
								variant: 'small-caps'
							}
						]
					}
				}
			},
			'body{font-family:roboto;font-variant:small-caps}',
			'body{font-family:Roboto, Arial, sans-serif;font-variant:small-caps}'
			);
	});

	it('resolves a font-stretch declaration', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{
								stretch: 'expanded'
							}
						]
					}
				}
			},
			'body{font-family:roboto;font-stretch:expanded}',
			'body{font-family:Roboto, Arial, sans-serif;font-stretch:expanded}'
		);
	});

	it('resolves a font declaration (shorthand syntax)', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{
								weight: ['light', 300],
								style: 'italic',
								variant: 'small-caps',
								stretch: 'expanded'
							}
						]
					}
				}
			},
			'body{font:light italic small-caps expanded 1rem/1.2 roboto}',
			'body{font:300 italic small-caps expanded 1rem/1.2 Roboto, Arial, sans-serif}'
		);
	});

	it('resolves an empty pack', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif'],
						propGroups: [
							{},
							{
								style: 'italic'
							}
						]
					}
				}
			},
			'body{font:1rem/1.2 roboto}',
			'body{font:1rem/1.2 Roboto, Arial, sans-serif}'
		);
	});

	it('throws if a font pack is not found', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto', 'Arial', 'sans-serif'],
							propGroups: [
								{
									style: 'italic'
								}
							]
						}
					}
				},
				'body{font:oblique 1rem/1.2 roboto}'
			);
		};
		expect(fn).to.throw(/pack not found/);
	});

	it('throws if a font pack is only partially matched', () => {
		var fn = () => {
			check(
				{
					packs: {
						roboto: {
							family: ['Roboto', 'Arial', 'sans-serif'],
							propGroups: [
								{
									style: 'italic',
									stretch: 'expanded'
								}
							]
						}
					}
				},
				'body{font:italic 1rem/1.2 roboto}'
			);
		};
		expect(fn).to.throw(`${ERROR_PREFIX} pack not found`);
	});

	it('remains silent for rules without font declarations', () => {
		check(
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif']
					}
				}
			},
			'body{color:red}',
			'body{color:red}'
		);
	});

});

function check(options: plugin.Options, input?: string, output?: string) {
	var processor = postcss([plugin(options)]);
	expect(processor.process(input).css).to.equal(output);
}
