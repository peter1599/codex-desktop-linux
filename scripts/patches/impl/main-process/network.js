const { findMatchingBrace } = require("../../lib/minified-js.js");

const FETCH_AUTH_SURFACE_HEADERS_MARKER = "codexLinuxFetchAuthSurfaceHeaders";
const IDENTIFIER = "[A-Za-z_$][\\w$]*";
const FETCH_AUTH_HELPER_PATTERN = new RegExp(
	`function (${IDENTIFIER})\\(\\{desktopOriginator:(${IDENTIFIER}),headers:(${IDENTIFIER}),state:(${IDENTIFIER})\\}\\)\\{`,
	"g",
);

function findFetchAuthHelper(source) {
	const matches = [];
	for (const match of source.matchAll(FETCH_AUTH_HELPER_PATTERN)) {
		const openBrace = match.index + match[0].length - 1;
		const closeBrace = findMatchingBrace(source, openBrace);
		if (closeBrace === -1) {
			continue;
		}

		const body = source.slice(openBrace, closeBrace + 1);
		const [, functionName, desktopOriginator, headers, state] = match;
		if (
			body.includes(`${state}.attachAuth`) &&
			body.includes(`${state}.token`) &&
			body.includes(`desktopOriginator:${desktopOriginator}`) &&
			(body.includes(`includeSurfaceHeaders:!1`) ||
				body.includes(`includeSurfaceHeaders:!0`)) &&
			body.includes(`${headers},${state}.token`)
		) {
			matches.push({
				openBrace,
				closeBrace,
				body,
				functionName,
			});
		}
	}
	return matches;
}

function applyLinuxFetchAuthSurfaceHeadersPatch(source) {
	if (source.includes(FETCH_AUTH_SURFACE_HEADERS_MARKER)) {
		return source;
	}

	const matches = findFetchAuthHelper(source);
	if (matches.length === 0) {
		console.warn(
			"WARN: Could not find desktop fetch auth helper - skipping Linux fetch surface headers patch",
		);
		return source;
	}
	if (matches.length > 1) {
		console.warn(
			`WARN: Found ${matches.length} desktop fetch auth helpers - skipping Linux fetch surface headers patch`,
		);
		return source;
	}

	const match = matches[0];
	if (match.body.includes("includeSurfaceHeaders:!0")) {
		return source;
	}

	const patchedBody = match.body.replace(
		"includeSurfaceHeaders:!1",
		`includeSurfaceHeaders:!0/*${FETCH_AUTH_SURFACE_HEADERS_MARKER}*/`,
	);
	if (patchedBody === match.body) {
		console.warn(
			`WARN: Could not patch ${match.functionName} - skipping Linux fetch surface headers patch`,
		);
		return source;
	}

	return (
		source.slice(0, match.openBrace) +
		patchedBody +
		source.slice(match.closeBrace + 1)
	);
}

module.exports = {
	FETCH_AUTH_SURFACE_HEADERS_MARKER,
	applyLinuxFetchAuthSurfaceHeadersPatch,
};
