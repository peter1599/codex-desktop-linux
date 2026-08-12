#!/usr/bin/env node

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	FETCH_AUTH_SURFACE_HEADERS_MARKER,
	applyLinuxFetchAuthSurfaceHeadersPatch,
} = require("./network.js");

const currentFetchAuthHelper =
	"before;function XF({desktopOriginator:e,headers:t,state:n}){!n.attachAuth||n.token==null||r.F(t,n.token,{desktopOriginator:e,includeSurfaceHeaders:!1})};after";

test("Linux fetch auth patch adds desktop surface headers", () => {
	const patched = applyLinuxFetchAuthSurfaceHeadersPatch(
		currentFetchAuthHelper,
	);

	assert.match(patched, new RegExp(FETCH_AUTH_SURFACE_HEADERS_MARKER));
	assert.match(patched, /includeSurfaceHeaders:!0/);
	assert.doesNotMatch(patched, /includeSurfaceHeaders:!1/);
});

test("Linux fetch auth patch is idempotent", () => {
	const patched = applyLinuxFetchAuthSurfaceHeadersPatch(
		currentFetchAuthHelper,
	);

	assert.equal(applyLinuxFetchAuthSurfaceHeadersPatch(patched), patched);
});

test("Linux fetch auth patch leaves an already-fixed helper unchanged", () => {
	const alreadyFixed = currentFetchAuthHelper.replace(
		"includeSurfaceHeaders:!1",
		"includeSurfaceHeaders:!0",
	);

	assert.equal(
		applyLinuxFetchAuthSurfaceHeadersPatch(alreadyFixed),
		alreadyFixed,
	);
});

test("Linux fetch auth patch skips upstream drift", () => {
	const warnings = [];
	const originalWarn = console.warn;
	console.warn = (message) => warnings.push(String(message));
	try {
		assert.equal(
			applyLinuxFetchAuthSurfaceHeadersPatch(
				"function unrelated(){return null}",
			),
			"function unrelated(){return null}",
		);
	} finally {
		console.warn = originalWarn;
	}

	assert.deepEqual(warnings, [
		"WARN: Could not find desktop fetch auth helper - skipping Linux fetch surface headers patch",
	]);
});

test("Linux fetch auth patch skips ambiguous helpers", () => {
	const helper = currentFetchAuthHelper.replace("XF", "YG");
	const warnings = [];
	const originalWarn = console.warn;
	console.warn = (message) => warnings.push(String(message));
	try {
		assert.equal(
			applyLinuxFetchAuthSurfaceHeadersPatch(
				`${currentFetchAuthHelper};${helper}`,
			),
			`${currentFetchAuthHelper};${helper}`,
		);
	} finally {
		console.warn = originalWarn;
	}

	assert.deepEqual(warnings, [
		"WARN: Found 2 desktop fetch auth helpers - skipping Linux fetch surface headers patch",
	]);
});
