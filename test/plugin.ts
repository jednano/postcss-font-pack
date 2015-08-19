///<reference path='../typings/tsd.d.ts'/>
import { expect } from 'chai';
import postcss from 'postcss';
import postcssFontPack, { PostCssFontPack } from '../lib/plugin';

// ReSharper disable WrongExpressionStatement
describe('postcss-font-pack plugin', () => {

	it('throws if configuration options are not provided', () => {
		check('', /missing required configuration/, void 0);
	});

	it('throws if packs option is not provided', () => {
		check('', /missing required option: packs/, <any>{});
	});

	it('throws if packs option has no keys', () => {
		check('', /packs option has no keys/, { packs: {} });
	});

	it('throws if a pack family is not specified', () => {
		check(
			'',
			/missing required pack.family/,
			{ packs: { a: <any>{ propGroups: <any>[] } } }
		);
	});

	it('throws if a pack family is empty', () => {
		check(
			'',
			/pack\.family is empty/,
			{ packs: { a: { family: <any>[] } } }
		);
	});

	it('throws if prop value is null', () => {
		check(
			'',
			/prop value expects string, number or array/,
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
			}
		);
	});

	it('throws if font declaration is missing a size', () => {
		check(
			'body{font:roboto}',
			/font property requires size and family/,
			{
				packs: {
					roboto: {
						family: ['Roboto']
					}
				}
			}
		);
	});

	it('throws if font declaration is missing a family', () => {
		check(
			'body{font:0}',
			/font property requires size and family/,
			{
				packs: {
					roboto: {
						family: ['Roboto']
					}
				}
			}
		);
	});

	it('throws if no pack is found for font-family property', () => {
		check(
			'body{font-family:foo}',
			/pack not found/,
			{
				packs: {
					roboto: {
						family: ['Roboto']
					}
				}
			}
		);
	});

	it('throws if more than one pack is found', () => {
		check(
			'body{font:bold 0 roboto}',
			/more than one pack found/,
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
			}
		);
	});

	it('throws if fallbacks are provided', () => {
		check(
			'body{font:0 roboto, Arial, sans-serif}',
			/pack not found/,
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif']
					}
				}
			}
		);
	});

	it('resolves a font-family declaration', () => {
		check(
			'body{font-family:roboto}',
			'body{font-family:Roboto, Arial, sans-serif}',
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif']
					}
				}
			}
		);
	});

	it('resolves a font-weight declaration', () => {
		check(
			'body{font-family:roboto;font-weight:300}',
			'body{font-family:Roboto, Arial, sans-serif;font-weight:300}',
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
			}
		);
	});

	it('resolves a font-weight declaration with an alias', () => {
		check(
			'body{font-family:roboto;font-weight:light}',
			'body{font-family:Roboto, Arial, sans-serif;font-weight:300}',
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
			}
		);
	});

	it('resolves a font-style declaration', () => {
		check(
			'body{font-family:roboto;font-style:italic}',
			'body{font-family:Roboto, Arial, sans-serif;font-style:italic}',
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
			}
		);
	});

	it('resolves a font-variant declaration', () => {
		check(
			'body{font-family:roboto;font-variant:small-caps}',
			'body{font-family:Roboto, Arial, sans-serif;font-variant:small-caps}',
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
			}
		);
	});

	it('resolves a font-stretch declaration', () => {
		check(
			'body{font-family:roboto;font-stretch:expanded}',
			'body{font-family:Roboto, Arial, sans-serif;font-stretch:expanded}',
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
			}
		);
	});

	it('resolves a font declaration (shorthand syntax)', () => {
		check(
			'body{font:light italic small-caps expanded 1rem/1.2 roboto}',
			'body{font:300 italic small-caps expanded 1rem/1.2 Roboto, Arial, sans-serif}',
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
			}
		);
	});

	it('resolves an empty pack', () => {
		check(
			'body{font:1rem/1.2 roboto}',
			'body{font:1rem/1.2 Roboto, Arial, sans-serif}',
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
			}
		);
	});

	it('throws if a font pack is not found', () => {
		check(
			'body{font:oblique 1rem/1.2 roboto}',
			/pack not found/,
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
			}
		);
	});

	it('throws if a font pack is only partially matched', () => {
		check(
			'body{font:italic 1rem/1.2 roboto}',
			/pack not found/,
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
			}
		);
	});

	it('throws if only a font-size is provided', () => {
		check(
			'body{font-size:0}',
			/font-size missing required family/,
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif']
					}
				}
			}
		);
	});

	it('remains silent for rules without font declarations', () => {
		check(
			'body{color:red}',
			'body{color:red}',
			{
				packs: {
					roboto: {
						family: ['Roboto', 'Arial', 'sans-serif']
					}
				}
			}
		);
	});

	describe('plugin options', () => {
		describe('requireSize: true', () => {
			it('throws if no font-size is specified', () => {
				check(
					'body{font-family:roboto}',
					/missing required font-size/,
					{
						requireSize: true,
						packs: {
							roboto: {
								family: ['Roboto', 'Arial', 'sans-serif']
							}
						}
					}
				);
			});

			it('remains silent when both size and family are provided', () => {
				const options: PostCssFontPack.Options = {
					requireSize: true,
					packs: {
						roboto: {
							family: ['Roboto', 'Arial', 'sans-serif']
						}
					}
				};
				check(
					'body{font-family:roboto;font-size:0}',
					'body{font-family:Roboto, Arial, sans-serif;font-size:0}',
					options
				);

				check(
					'body{font:1rem roboto}',
					'body{font:1rem Roboto, Arial, sans-serif}',
					options
				);
			});
		});
	});

	describe('directives', () => {
		const options: PostCssFontPack.Options = {
			requireSize: true,
			packs: {
				roboto: {
					family: ['Roboto', 'Arial', 'sans-serif']
				}
			}
		};

		it('throws an error if an unknown foo-bar directive is defined', () => {
			check(
				'/* postcss-font-pack: foo-bar */',
				/Unsupported directive: foo-bar/,
				options
			);
		});

		it('throws an error if start-ignore is defined twice', () => {
			check(
				[
					'/* postcss-font-pack: start-ignore */',
					'/* postcss-font-pack: start-ignore */'
				].join(''),
				/start-ignore already defined/,
				options
			);
		});

		it('throws an error if ignore-next is defined after a start-ignore', () => {
			check(
				[
					'/* postcss-font-pack: start-ignore */',
					'/* postcss-font-pack: ignore-next */'
				].join(''),
				/Unnecessary ignore-next after start-ignore/,
				options
			);
		});

		it('throws an error if end-ignore is defined before a start-ignore', () => {
			check(
				'/* postcss-font-pack: end-ignore */',
				/start-ignore not defined/,
				options
			);
		});

		it('ignores a /* postcss-foo: bar */ comment', () => {
			const css = '/* postcss-foo: bar */';
			check(css, css, options);
		});

		it('ignores multiple ranges spanning across multiple lines', () => {
			const css = [
				'/* postcss-font-pack: start-ignore */',
				'body{font:foo}',
				'/* postcss-font-pack: end-ignore */',
				'/* postcss-font-pack: start-ignore */',
				'body{font:bar}',
				'/* postcss-font-pack: end-ignore */'
			].join('\n');
			check(css, css, options);
		});

		const fontProps = [
			'font',
			'font-family',
			'font-weight',
			'font-style',
			'font-variant',
			'font-stretch',
			'font-size'
		];

		it('ignores declarations within start-ignore and end-ignore range', () => {
			for (const fontProp of fontProps) {
				const css = sandwich(fontProp);
				check(css, css, options);
			}

			function sandwich(propName) {
				return [
					'/* postcss-font-pack: start-ignore */',
					`body{${propName}:foo}`,
					'/* postcss-font-pack: end-ignore */'
				].join('');
			}
		});

		it('ignores the next font declaration after ignore-next', () => {
			for (const fontProp of fontProps) {
				const css = sandwich(fontProp);
				check(css, css, options);
			}

			function sandwich(propName) {
				return [
					'/* postcss-font-pack: ignore-next */',
					`body{${propName}:foo}`
				].join('');
			}
		});

		it('does not ignore the 2nd font declaration after ignore-next', () => {
			check(
				[
					'/* postcss-font-pack: ignore-next */',
					'body{font:1rem roboto}',
					'body{font:1rem roboto}'
				].join(''),
				[
					'/* postcss-font-pack: ignore-next */',
					'body{font:1rem roboto}',
					'body{font:1rem Roboto, Arial, sans-serif}'
				].join(''),
				options
			);
		});
	});

	function check(
		actual: string,
		expected?: string|RegExp,
		options?: PostCssFontPack.Options
	) {
		const processor = postcss().use(postcssFontPack(options));
		if (expected instanceof RegExp) {
			expect(() => {
				return processor.process(stripTabs(actual)).css;
			}).to.throw(expected);
			return;
		}
		expect(
			processor.process(stripTabs(actual)).css
		).to.equal(
			stripTabs(<string>expected)
		);
	}

	function stripTabs(input: string) {
		return input.replace(/\t/g, '');
	}
});
