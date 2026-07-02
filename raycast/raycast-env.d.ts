/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Canvas Access Token - Canvas → Account → Settings → New Access Token. */
  "canvasToken": string,
  /** Canvas API Base URL - Your school's Canvas REST API base (include /api/v1). */
  "canvasBaseUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `upcoming` command */
  export type Upcoming = ExtensionPreferences & {}
  /** Preferences accessible in the `courses` command */
  export type Courses = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `upcoming` command */
  export type Upcoming = {}
  /** Arguments passed to the `courses` command */
  export type Courses = {}
}

