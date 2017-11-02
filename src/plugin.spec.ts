import test, { TestContext } from 'ava';
import * as postcss from 'postcss';

import * as plugin from './plugin';

test('throws if configuration options are not provided', macro,
	'',
	/missing required configuration/
);

test('throws if packs option is not provided', macro,
	'',
	/missing required option: packs/,
	{}
);

test('throws if packs option has no keys', macro,
	'',
	/packs option has no keys/,
	{ packs: {} }
);

test('throws if a pack family is not specified', macro,
	'',
	/missing required pack.family/,
	{ packs: { a: { propGroups: [] } } }
);

test('throws if a pack family is empty', macro,
	'',
	/pack\.family is empty/,
	{ packs: { a: { family: [] } } }
);

test('throws if prop value is null', macro,
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

test('throws if font declaration is missing a size', macro,
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

test('throws if font declaration is missing a family', macro,
	'body{font:0}',
	/font property requires size and family/,		{
		packs: {
			roboto: {
				family: ['Roboto']
			}
		}
	}
);

test('throws if no pack is found for font-family property', macro,
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

test('throws if more than one pack is found', macro,
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

test('throws if fallbacks are provided', macro,
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

test('ignores a font declaration', macro,
	'body{font:0/0 serif}',
	'body{font:0/0 serif}',
	{
		ignoreDeclarations: [
			{ font: '0/0 serif' }
		],
		packs: {
			roboto: {
				family: ['Roboto', 'Arial', 'sans-serif']
			}
		}
	}
);

test('resolves a font-family declaration', macro,
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

test('resolves a font-weight declaration', macro,
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

test('resolves a font-weight declaration with an alias', macro,
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

test('resolves a font-style declaration', macro,
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

test('resolves a font-variant declaration', macro,
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

test('resolves a font-stretch declaration', macro,
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

test('resolves a font declaration (shorthand syntax)', macro,
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

test('resolves an empty pack', macro,
	'body{font:1rem/1.2 roboto}',
	'body{font:1rem/1.2 Roboto, Arial, sans-serif}',
	{
		packs: {
			roboto: {
				family: ['Roboto', 'Arial', 'sans-serif'],
				propGroups: [
					{}
				]
			}
		}
	}
);

test('throws if a font pack is not found', macro,
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

test('throws if a font pack is only partially matched', macro,
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

test('throws if only a font-size is provided', macro,
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

test('remains silent for rules without font declarations', macro,
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

// Plugin Options
// requireSize: true
test('throws if no font-size is specified', macro,
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

test('remains silent when both size and family are provided', t => {
	const options: plugin.Options = {
		requireSize: true,
		packs: {
			roboto: {
				family: ['Roboto', 'Arial', 'sans-serif']
			}
		}
	};
	macro(t,
		'body{font-family:roboto;font-size:0}',
		'body{font-family:Roboto, Arial, sans-serif;font-size:0}',
		options
	);

	macro(t,
		'body{font:1rem roboto}',
		'body{font:1rem Roboto, Arial, sans-serif}',
		options
	);
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

test('throws an error if an unknown foo-bar directive is defined', macro,
	'/* postcss-font-pack: foo-bar */',
	/Unsupported directive: foo-bar/,
	options
);

test('throws an error if start-ignore is defined twice', macro,
	[
		'/* postcss-font-pack: start-ignore */',
		'/* postcss-font-pack: start-ignore */'
	].join(''),
	/start-ignore already defined/,
	options
);

test('throws an error if ignore-next is defined after a start-ignore', macro,
	[
		'/* postcss-font-pack: start-ignore */',
		'/* postcss-font-pack: ignore-next */'
	].join(''),
	/Unnecessary ignore-next after start-ignore/,
	options
);

test('throws an error if end-ignore is defined before a start-ignore', macro,
	'/* postcss-font-pack: end-ignore */',
	/start-ignore not defined/,
	options
);

test('ignores a /* postcss-foo: bar */ comment', t => {
	const css = '/* postcss-foo: bar */';
	macro(t, css, css, options);
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
	macro(t, css, css, options);
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
		macro(t, css, css, options);
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
		macro(t, css, css, options);
		const css2 = sandwich2(fontProp);
		macro(t, css2, css2, options);
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

test('does not ignore the 2nd font declaration after ignore-next', macro,
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

function macro(
	t: TestContext,
	input: string,
	expectedOutput?: string | RegExp,
	options?: plugin.Options
) {
	if (expectedOutput instanceof RegExp) {
		t.throws(transpile, expectedOutput);
		return;
	}
	t.is(
		transpile(),
		stripTabs(expectedOutput)
	);
	function transpile() {
		const processor = postcss([plugin(options)]);
		return processor.process(stripTabs(input)).css;
	}
	function stripTabs(input: string) {
		return input.replace(/\t/g, '');
	}
}
