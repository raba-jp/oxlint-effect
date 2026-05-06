import { eslintCompatPlugin } from "@oxlint/plugins";
import noBlockInFpCallback from "./rules/no-block-in-fp-callback.js";
import noCallWrappingPipe from "./rules/no-call-wrapping-pipe.js";
import noDirectTagAccess from "./rules/no-direct-tag-access.js";
import noEffectGen from "./rules/no-effect-gen.js";
import noIntermediateEffectVariables from "./rules/no-intermediate-effect-variables.js";
import noEffectIfOptionCheck from "./rules/no-effect-if-option-check.js";
import noMethodPipe from "./rules/no-method-pipe.js";
import noNestedPipe from "./rules/no-nested-pipe.js";
import noNestedPipes from "./rules/no-nested-pipes.js";
import noPipeInFpCallback from "./rules/no-pipe-in-fp-callback.js";
import noSwitchStatement from "./rules/no-switch-statement.js";
import noUnnecessaryPipeWrapper from "./rules/no-unnecessary-pipe-wrapper.js";
import preferAndThen from "./rules/prefer-andThen.js";
import preferAsVoid from "./rules/prefer-as-void.js";
import preferAs from "./rules/prefer-as.js";
import preferEffectIfOverMatchBoolean from "./rules/prefer-effect-if-over-match-boolean.js";
import preferEffectPlatform from "./rules/prefer-effect-platform.js";
import preferFilterOrFail from "./rules/prefer-filter-or-fail.js";
import preferFlatten from "./rules/prefer-flatten.js";
import preferFromNullable from "./rules/prefer-from-nullable.js";
import preferGetOrElse from "./rules/prefer-get-or-else.js";
import preferGetOrNull from "./rules/prefer-get-or-null.js";
import preferGetOrUndefined from "./rules/prefer-get-or-undefined.js";
import preferMatchOverConditionals from "./rules/prefer-match-over-conditionals.js";
import preferMatchOverTernary from "./rules/prefer-match-over-ternary.js";
import preferMatchTag from "./rules/prefer-match-tag.js";

const plugin = eslintCompatPlugin({
  meta: { name: "effect" },
  rules: {
    "no-block-in-fp-callback": noBlockInFpCallback,
    "no-call-wrapping-pipe": noCallWrappingPipe,
    "no-direct-tag-access": noDirectTagAccess,
    "no-effect-gen": noEffectGen,
    "no-effect-if-option-check": noEffectIfOptionCheck,
    "no-intermediate-effect-variables": noIntermediateEffectVariables,
    "no-method-pipe": noMethodPipe,
    "no-nested-pipe": noNestedPipe,
    "no-nested-pipes": noNestedPipes,
    "no-pipe-in-fp-callback": noPipeInFpCallback,
    "no-switch-statement": noSwitchStatement,
    "no-unnecessary-pipe-wrapper": noUnnecessaryPipeWrapper,
    "prefer-andThen": preferAndThen,
    "prefer-as-void": preferAsVoid,
    "prefer-as": preferAs,
    "prefer-effect-if-over-match-boolean": preferEffectIfOverMatchBoolean,
    "prefer-effect-platform": preferEffectPlatform,
    "prefer-filter-or-fail": preferFilterOrFail,
    "prefer-flatten": preferFlatten,
    "prefer-from-nullable": preferFromNullable,
    "prefer-get-or-else": preferGetOrElse,
    "prefer-get-or-null": preferGetOrNull,
    "prefer-get-or-undefined": preferGetOrUndefined,
    "prefer-match-over-conditionals": preferMatchOverConditionals,
    "prefer-match-over-ternary": preferMatchOverTernary,
    "prefer-match-tag": preferMatchTag,
  },
});

export default plugin;
