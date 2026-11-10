// The design-time "Tweaks" panel is not part of the published app: fixed look, no panel.
window.useTweaks = function (defaults) { return [defaults, function () {}]; };
window.TweaksPanel = function () { return null; };
window.TweakSection = function () { return null; };
window.TweakColor = function () { return null; };
window.TweakRadio = function () { return null; };
