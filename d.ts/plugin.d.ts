/// <reference path="../typings/node/node.d.ts" />
declare var PostCssFontPack: (options: PostCssFontPack.Options) => void;
declare module PostCssFontPack {
    /**
     * Plugin options.
     */
    interface Options {
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
