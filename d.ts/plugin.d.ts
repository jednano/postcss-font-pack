/// <reference path="../typings/node/node.d.ts" />
declare var PostCssFontPack: (options: PostCssFontPack.Options) => void;
declare module PostCssFontPack {
    /**
     * Plugin options.
     */
    interface Options {
        /**
         * When true, an error will be thrown if you have a rule with one or more
         * font declarations, but without a font size.
         */
        requireSize?: boolean;
        /**
         * Supported font packs.
         */
        packs: {
            [key: string]: Pack;
        };
    }
    interface Pack {
        family: string[];
        propGroups?: PropGroup[];
    }
    /**
     * A collection of supported properties for the associated font family.
     */
    interface PropGroup {
        weight?: string | number | (string | number)[];
        style?: string | string[];
        variant?: string | string[];
        stretch?: string | string[];
    }
}
export = PostCssFontPack;
