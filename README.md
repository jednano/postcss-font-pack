# postcss-font-pack

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo-leftp.png">

[![Build Status](https://travis-ci.org/jedmao/postcss-font-pack.svg?branch=master)](https://travis-ci.org/jedmao/postcss-font-pack)
[![npm version](https://badge.fury.io/js/postcss-font-pack.svg)](http://badge.fury.io/js/postcss-font-pack)
[![Code Climate](https://codeclimate.com/github/jedmao/postcss-font-pack/badges/gpa.svg)](https://codeclimate.com/github/jedmao/postcss-font-pack)
[![Test Coverage](https://codeclimate.com/github/jedmao/postcss-font-pack/badges/coverage.svg)](https://codeclimate.com/github/jedmao/postcss-font-pack)
[![npm license](http://img.shields.io/npm/l/postcss-font-pack.svg?style=flat-square)](https://www.npmjs.org/package/postcss-font-pack)

[![npm](https://nodei.co/npm/postcss-font-pack.svg?downloads=true)](https://nodei.co/npm/postcss-font-pack/)

[PostCSS](https://github.com/postcss/postcss) plugin to simplify font declarations by validating only configured font packs are used, adding fallbacks and translating human-readable weight names into CSS-valid values.

## Introduction

Dealing with fonts can be a pain, especially on teams where not everybody knows where to find the exact fonts they are allowed to use. As a result, mistakes are made, inconsistencies are introduced and maintenance becomes a nightmare. PostCSS Font Pack aims to solve this problem with configuration.

## Configuration

Let's start with the following assumptions:
- We're using "Times New Roman" because it's a commonly used [web safe font](http://www.w3schools.com/cssref/css_websafe_fonts.asp). It also illustrates how to use fonts that need quotes in this plugin.
- We've installed [Roboto](http://www.fontsquirrel.com/fonts/roboto?q%5Bterm%5D=roboto&q%5Bsearch_check%5D=Y) and already setup its [@font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face).

These fonts can be defined in JSON format. You might call it `font-packs.json`:

```json
{
	"times": {
		"family": ["'Times New Roman'", "Times", "serif"],
		"props": [
			{},
			{
				"weight": ["bold", 700]
			}
		]
	},
	"roboto": {
		"family": ["Roboto", "Arial", "sans-serif"],
		"props": [
			{
				"style": "italic",
				"weight": ["light", 300],
				"stretch": "condensed",
				"variant": "small-caps"
			}
		]
	}
}
```

With the above configuration, we can write our CSS using the [font shorthand property](https://developer.mozilla.org/en-US/docs/Web/CSS/font):

```css
.foo {
	font: bold 1rem/1.2 'Times New Roman', Times, serif;
}

.bar {
	font: light condensed italic 1rem/1.2 roboto;
}
```

This would transpile into the following:

```css
.foo {
	font: 700 1rem/1.2 'Times New Roman', Times, serif;
}

.bar {
	font: 300 condensed italic 1rem/1.2 Roboto, Arial, sans-serif;
}
```

Notice the weight was changed from `bold` to `700` and from `light` to `300`. This came from the configuration's declaration value aliases, which were defined as `"weight": ["bold", 700]` and `"weight": ["light", 300]`, respectively. You can do this with any of the `props`, but since `style: italic`, `stretch: condensed` and `variant: small-caps` are already understood by the browser, it only made sense to use an alias for the weight in this case. You could have just as well congired the weight as `"weight": 300`, but that's not as human-readable as `light`, which the browser doesn't understand.

Also, notice that fallback fonts were added to the `font-family`. This allows you to keep your syntax easy to read/write and let the plugin do the dirty work with configuration.

You don't have to use the font shorthand property. You can also write-out each declaration individually or you can use the [`postcss-nested-props`](https://github.com/jedmao/postcss-nested-props) plugin to enable a nested syntax.

## Validation

This plugin also handles validation so you can sleep sound knowing that nobody is using fonts or combinations of font declarations that are not supported or go against the design of the site. Here's what happens if someone tries to use an unsupported font family:

```css
.foo {
	font-family: "Futura PT";
}
```

> [postcss-font-pack] no pack found for family: "Futura PT"

What happens if you try to use a supported font family and add your own fallbacks?

```css
.foo {
	font-family: roboto, sans-serif;
}
```

> [postcss-font-pack] fallbacks may only be defined in plugin options

How about a supported font family with an unsupported pack?

```css
.foo {
	font: light 1rem/1.2 roboto;
}
```

> [postcss-font-pack] no pack found for family: roboto, weight: light

Even though the `light` weight is found in your configuration, there is no font pack that uses `light` without also using `italic` and `condensed`. In this case, you have to use all three of them together to form a pack and to pass validation.

As you can see, this plugin will stop unsupported font declarations dead in their tracks.

## Installation

```
$ npm install postcss-font-pack
```

## Usage

### JavaScript

```js
postcss([
	require('postcss-font-pack')({
		fonts: require('./font-packs.json')
	})
]);
```

### TypeScript

```ts
///<reference path="node_modules/postcss-font-pack/.d.ts" />
import postcssFontPack = require('postcss-font-pack');

postcss([
	postcssFontPack({
		fonts: require('./font-packs.json')
	})
]);
```

## Options

### `fonts`

Type: `Object`  
Required: `true`

An object literal containing all the font families you wish to support as keys. The values can have any of the following:

#### `fallbacks`

Type: `string[]`  
Required: `false`

These will be concatenated with the parent key to form the `font-family` value.

#### `packs`

Type: `Object[]`  
Required: `false`

Each pack may contain the following as keys:
- `weight` value maps to keys in the [`weightMap`](#weightMap)
- [`style`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style)
- [`variant`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant)
- [`stretch`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch)

#### `weightMap`

Type: `Object`  
Required: `false`

The keys are aliases, so they can technically be anything you like; however, it's probably best to slugify the names given by the fonts themselves. One font might use "Extra Light" to map to `200`, but another font might use "Ultra Light" to map to the same `200` weight. Slugified, you would use `extra-light` and `ultra-light`, respectively.

All keys will be translated into their respective values, so make sure the values are [valid values](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#Values). Using numeric font weights for values is recommended.
