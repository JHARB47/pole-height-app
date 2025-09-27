// Minimal JS config for Netlify Visual Editor compatibility.
// The TS file `stackbit.config.ts` is the authoritative config used by editors that support TS.
// Some tools only check for a JS file and require `stackbitVersion` to be present.

/** @type {import('@stackbit/types').StackbitConfig} */
module.exports = {
	stackbitVersion: '~0.6.0',
	// Intentionally keep contentSources empty here. The Visual Editor will use
	// the remote Content Source Interface (CSI) configuration as shown in logs.
	// The full models live in stackbit.config.ts.
	contentSources: [],
};
