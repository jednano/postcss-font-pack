import test, { ContextualTestContext } from 'ava';
import * as postcss from 'postcss';

import * as plugin from './plugin';

test(
	'throws if configuration options are not provided',
	scenario('', /missing required configuration/, void 0)
);

test(
	'throws if packs option is not provided',
	scenario('', /missing required option: packs/, <any>{})
);

test(
	'throws if packs option has no keys',
	scenario('', /packs option has no keys/, { packs: {} })
);

test(
	'throws if a pack family is not specified',
	scenario(
		'',
		/missing required pack.family/,
		{ packs: { a: <any>{ propGroups: <any>[] } } }
	)
);

test(
	'throws if a pack family is empty',
	scenario(
		'',
		/pack\.family is empty/,
		{ packs: { a: { family: <any>[] } } }
	)
);

test(
	'throws if prop value is null',
	scenario(
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
	)
);

test(
	'throws if font declaration is missing a size',
	scenario(
		'body{font:roboto}',
		/font property requires size and family/,
		{
			packs: {
				roboto: {
					family: ['Roboto']
				}
			}
		}
	)
);

test(
	'throws if font declaration is missing a family',
	scenario(
		'body{font:0}',
		/font property requires size and family/,
		{
			packs: {
				roboto: {
					family: ['Roboto']
				}
			}
		}
	)
);

test(
	'throws if no pack is found for font-family property',
	scenario(
		'body{font-family:foo}',
		/pack not found/,
		{
			packs: {
				roboto: {
					family: ['Roboto']
				}
			}
		}
	)
);

test(
	'throws if more than one pack is found',
	scenario(
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
	)
);

test(
	'throws if fallbacks are provided',
	scenario(
		'body{font:0 roboto, Arial, sans-serif}',
		/pack not found/,
		{
			packs: {
				roboto: {
					family: ['Roboto', 'Arial', 'sans-serif']
				}
			}
		}
	)
);

test(
	'resolves a font-family declaration',
	scenario(
		'body{font-family:roboto}',
		'body{font-family:Roboto, Arial, sans-serif}',
		{
			packs: {
				roboto: {
					family: ['Roboto', 'Arial', 'sans-serif']
				}
			}
		}
	)
);

test(
	'resolves a font-weight declaration',
	scenario(
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
	)
);

test(
	'resolves a font-weight declaration with an alias',
	scenario(
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
	)
);

test(
	'resolves a font-style declaration',
	scenario(
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
	)
);

test(
	'resolves a font-variant declaration',
	scenario(
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
	)
);

test(
	'resolves a font-stretch declaration',
	scenario(
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
	)
);

test(
	'resolves a font declaration (shorthand syntax)',
	scenario(
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
	)
);

test(
	'resolves an empty pack',
	scenario(
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
	)
);

test(
	'throws if a font pack is not found',
	scenario(
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
	)
);

test(
	'throws if a font pack is only partially matched',
	scenario(
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
	)
);

test(
	'throws if only a font-size is provided',
	scenario(
		'body{font-size:0}',
		/font-size missing required family/,
		{
			packs: {
				roboto: {
					family: ['Roboto', 'Arial', 'sans-serif']
				}
			}
		}
	)
);

test(
	'remains silent for rules without font declarations',
	scenario(
		'body{color:red}',
		'body{color:red}',
		{
			packs: {
				roboto: {
					family: ['Roboto', 'Arial', 'sans-serif']
				}
			}
		}
	)
);

// Plugin Options
// requireSize: true
test(
	'throws if no font-size is specified',
	scenario(
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
	)
);

test('remains silent when both size and family are provided', t => {
	const options: plugin.Options = {
		requireSize: true,
		packs: {
			roboto: {
				family: ['Roboto', 'Arial', 'sans-serif']
			}
		}
	};
	scenario(
		'body{font-family:roboto;font-size:0}',
		'body{font-family:Roboto, Arial, sans-serif;font-size:0}',
		options
	)(t);

	scenario(
		'body{font:1rem roboto}',
		'body{font:1rem Roboto, Arial, sans-serif}',
		options
	)(t);
});

// Directives
const options: plugin.Options = {
	requireSize: true,
	packs: {
		roboto: {
			family: ['Roboto', 'Arial', 'sans-serif']
		}
	}
};

test(
	'throws an error if an unknown foo-bar directive is defined',
	scenario(
		'/* postcss-font-pack: foo-bar */',
		/Unsupported directive: foo-bar/,
		options
	)
);

test(
	'throws an error if start-ignore is defined twice',
	scenario(
		[
			'/* postcss-font-pack: start-ignore */',
			'/* postcss-font-pack: start-ignore */'
		].join(''),
		/start-ignore already defined/,
		options
	)
);

test(
	'throws an error if ignore-next is defined after a start-ignore',
	scenario(
		[
			'/* postcss-font-pack: start-ignore */',
			'/* postcss-font-pack: ignore-next */'
		].join(''),
		/Unnecessary ignore-next after start-ignore/,
		options
	)
);

test(
	'throws an error if end-ignore is defined before a start-ignore',
	scenario(
		'/* postcss-font-pack: end-ignore */',
		/start-ignore not defined/,
		options
	)
);

test('ignores a /* postcss-foo: bar */ comment', t => {
	const css = '/* postcss-foo: bar */';
	scenario(css, css, options)(t);
});

test('ignores multiple ranges spanning across multiple lines', t => {
	const css = [
		'/* postcss-font-pack: start-ignore */',
		'body{font:foo}',
		'/* postcss-font-pack: end-ignore */',
		'/* postcss-font-pack: start-ignore */',
		'body{font:bar}',
		'/* postcss-font-pack: end-ignore */'
	].join('\n');
	scenario(css, css, options)(t);
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

test('ignores declarations within start-ignore and end-ignore range', t => {
	for (const fontProp of fontProps) {
		const css = sandwich(fontProp);
		scenario(css, css, options)(t);
	}

	function sandwich(propName: string) {
		return [
			'/* postcss-font-pack: start-ignore */',
			`body{${propName}:foo}`,
			'/* postcss-font-pack: end-ignore */'
		].join('');
	}
});

test('ignores the next font declaration after ignore-next', t => {
	for (const fontProp of fontProps) {
		const css = sandwich(fontProp);
		scenario(css, css, options)(t);
		const css2 = sandwich2(fontProp);
		scenario(css2, css2, options)(t);
	}

	function sandwich(propName: string) {
		return [
			'/* postcss-font-pack: ignore-next */',
			`body{${propName}:foo}`
		].join('');
	}

	function sandwich2(propName: string) {
		return [
			'body {',
			'  /* postcss-font-pack: ignore-next */',
			`  ${propName}: foo`,
			'}'
		].join('');
	}
});

test(
	'does not ignore the 2nd font declaration after ignore-next',
	scenario(
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
	)
);

function scenario(
	input: string,
	expectedOutput?: string|RegExp,
	options?: plugin.Options
) {
	const processor = postcss([plugin(options)]);
	return (t: ContextualTestContext) => {
		if (expectedOutput instanceof RegExp) {
			t.throws(
				() => processor.process(stripTabs(input)).css,
				expectedOutput
			);
			return;
		}
		t.is(
			processor.process(stripTabs(input)).css,
			stripTabs(expectedOutput)
		);
	};
}

function stripTabs(input: string) {
	return input.replace(/\t/g, '');
}
