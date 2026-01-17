/**
 * Copyright 2025 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Type declarations for the browser namespace.
 * The browser namespace is the standard WebExtensions API namespace used by
 * Firefox, Safari, and other browsers. Chrome also supports this namespace
 * as an alias for the chrome namespace.
 *
 * This declaration makes the browser namespace available as a type-compatible
 * alias for the chrome namespace at runtime.
 *
 * Note: For type annotations (e.g., parameter types), use the chrome namespace
 * types directly (e.g., chrome.runtime.Port) since TypeScript can't merge
 * const and namespace declarations.
 */
declare const browser: typeof chrome;
