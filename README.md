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

[PostCSS](https://github.com/postcss/postcss) plugin to simplify font declarations by validating only configured font packs are used, adding fallbacks and transpiling human-readable font declaration values into valid CSS.

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
		"propGroups": [
			{},
			{
				"weight": ["bold", 700]
			}
		]
	},
	"roboto": {
		"family": ["Roboto", "Arial", "sans-serif"],
		"propGroups": [
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
	font: bold 1rem/1.2 times;
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

Notice the weight was changed from `bold` to `700` and from `light` to `300`. This came from the configuration's declaration value aliases, which were defined as `"weight": ["bold", 700]` and `"weight": ["light", 300]`, respectively. You can do this with any of the prop groups, but since `style: italic`, `stretch: condensed` and `variant: small-caps` are already understood by the browser, it only made sense to use an alias for the weight in this case. You could have just as well congired the weight as `"weight": 300`, but that's not as human-readable as `light`, which the browser doesn't understand.

Also, notice that fallback fonts were added to the `font-family`. This allows you to keep your syntax easy to read/write and let the plugin do the dirty work with configuration.

You don't have to use the font shorthand property. You can also write-out each declaration individually or you can use the [`postcss-nested-props`](https://github.com/jedmao/postcss-nested-props) plugin to enable a nested syntax. Just make sure you unwrap the nested with that plugin before you run this one.

## Validation

This plugin also handles validation so you can sleep sound knowing that nobody is using fonts or combinations of font declarations that are not supported or otherwise go against the design of the site. The following rules would all throw the same error, "pack not found":

```css
.foo {
	font-family: "Futura PT";
}

.bar {
	font-family: roboto, sans-serif;
}

.baz {
	font: light 1rem/1.2 roboto;
}
```

Even though the `light` weight is found in your configuration, there is no font pack that uses `light` without also using `italic` and `condensed`. You have to use all three of them together to form a pack and to pass validation.

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
		packs: require('./font-packs.json')
	})
]);
```

### TypeScript

```ts
///<reference path="node_modules/postcss-font-pack/.d.ts" />
import postcssFontPack = require('postcss-font-pack');

postcss([
	postcssFontPack({
		packs: require('./font-packs.json')
	})
]);
```

## Options

### `requireSize`

Type: `boolean`  
Required: `false`  
Default: `false`

When `true`, an error will be thrown if you have a rule with one or more font declarations, but without a font size.

```css
.foo {
	font-family: roboto;
	/* missing required font-size */
}
```

Regardless of this option, if you have a rule with only a `font-size` specified you will get an error:

```css
.foo {
	font-size: 1rem;
	/* font-size missing required family */
}
```

### `packs`

Type: `Object`  
Required: `true`

An object literal where the keys are slugified fonts and the values are font packs. Each font pack consists of a required `family` and an optional collection of property groups, named as `propGroups`.

#### `pack.family`

Type: `string[]`  
Required: `true`

If your font slug is `times`, this is where you would define the extended font name along with any fallbacks.

_Note: If your font name requires quotes, you must add them yourself._

#### `pack.propGroups`

Type: `PropGroup[]`
Required: `false`

Define the property combinations that can be used together to reference a font.

##### `pack.propGroups[n]`

Type: `PropGroup`

Each prop group may contain 0 or more of the following keys:
- [`weight`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style)
- [`style`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style)
- [`variant`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant)
- [`stretch`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch)

Each value can be a `string` or a `string[]` with two values. The first value is a slugified value that you can type in your CSS to reference the associated key. The second value is what the first value will be transpiled into, so make sure they are CSS-valid. The `weight` values can additionally be numbers.

If an empty object is provided, this indicates that you want to support this font family with default browser values for weight, style, variant and stretch.

_Note: If you don't include an empty object you will be unable to reference a family without also referencing additional properties._
