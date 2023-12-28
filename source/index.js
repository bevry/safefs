/* eslint no-sync:0 */
'use strict'

// builtins
const pathUtil = require('path')
const processUtil = require('process')
const nodeVersion = processUtil.versions.node
const umask = processUtil.umask
const cwd = processUtil.cwd
const exec = require('child_process').exec

// packages
const fsUtil = require('graceful-fs')
const versionCompare = require('version-compare').default

// =====================================
// Define Module

/**
 * Utilities to safely interact with the filesystem.
 */
const safefs = {
	// =====================================
	// Our own custom functions

	/**
	 * Get the parent path
	 * @param  {String} path
	 * @return {String}
	 */
	getParentPathSync(path) {
		return (
			path
				// remove trailing slashes
				.replace(/[/\\]$/, '')
				// remove last directory
				.replace(/[/\\][^/\\]+$/, '')
		)
	},

	/**
	 * @callback EnsurePathCallback
	 * @param {Error|null} err
	 * @param {Boolean} existed
	 * @returns {void}
	 */
	/**
	 * Ensure the path exists
	 * @param {String} path
	 * @param {Object} opts
	 * @param {Number} opts.mode
	 * @param {EnsurePathCallback} next
	 * @returns {this}
	 */
	ensurePath(path, opts, next) {
		// Prepare
		if (next == null) {
			next = opts
			opts = null
		}
		opts = opts || {}

		// Check
		fsUtil.exists(path, function (exists) {
			// Error
			if (exists) return next(null, true)

			// Success
			const parentPath = safefs.getParentPathSync(path)
			safefs.ensurePath(parentPath, opts, function (err) {
				// Error
				if (err) return next(err, false)

				// Success
				safefs.mkdir(path, opts.mode, function () {
					// ignore mkdir error, as if it already exists, then we are winning

					fsUtil.exists(path, function (exists) {
						// Error
						if (!exists) {
							const err = new Error(`Failed to create the directory: ${path}`)
							return next(err, false)
						}

						// Success
						next(null, false)
					})
				})
			})
		})

		// Chain
		return safefs
	},

	// =====================================
	// Safe Wrappers for Standard Methods

	/**
	 * @callback Errback
	 * @param {Error|null} err
	 * @returns {void}
	 */
	/**
	 * Write the file, ensuring the path exists
	 * @param {String} path
	 * @param {String|Buffer} data
	 * @param {WriteFileOptions} opts
	 * @param {Errback} next
	 * @returns {this}
	 */
	writeFile(path, data, opts, next) {
		// Prepare
		if (next == null) {
			next = opts
			opts = null
		}

		// Ensure path
		safefs.ensurePath(pathUtil.dirname(path), opts, function (err) {
			// Error
			if (err) return next(err)

			// Write data
			fsUtil.writeFile(path, data, opts, next)
		})

		// Chain
		return safefs
	},

	/**
	 * Append to the file, ensuring the path exists
	 * @param {String} path
	 * @param {String|Buffer} data
	 * @param {WriteFileOptions} opts
	 * @param {Errback} next
	 * @returns {this}
	 */
	appendFile(path, data, opts, next) {
		// Prepare
		if (next == null) {
			next = opts
			opts = null
		}

		// Ensure path
		safefs.ensurePath(pathUtil.dirname(path), opts, function (err) {
			// Error
			if (err) return next(err)

			// Write data
			fsUtil.appendFile(path, data, opts, next)
		})

		// Chain
		return safefs
	},

	/**
	 * Make the directory
	 * @param {String} path
	 * @param {Number} mode
	 * @param {Errback} next
	 * @returns {this}
	 */
	mkdir(path, mode, next) {
		// Prepare
		if (next == null) {
			next = mode
			mode = null
		}
		if (mode == null) {
			/* eslint no-bitwise:0, no-magic-numbers:0 */
			mode = 0o777 & ~umask()
		}

		// Action
		fsUtil.mkdir(path, mode, next)

		// Chain
		return safefs
	},

	/**
	 * Remove the file, don't error if the path is already removed.
	 * @param {String} path
	 * @param {Errback} next
	 * @returns {this}
	 */
	unlink(path, next) {
		// Stat
		fsUtil.exists(path, function (exists) {
			if (exists === false) return next()
			fsUtil.unlink(path, next)
		})

		// Chain
		return safefs
	},

	/**
	 * Remove the directory, don't error if the path is already removed.
	 * @param {String} path
	 * @param {Errback} next
	 * @returns {this}
	 */
	rimraf(path, next) {
		function wrappedNext(err) {
			if (err && err.code === 'ENOENT') return next()
			next(err)
		}

		// https://nodejs.org/api/fs.html#fsrmdirpath-options-callback
		if (versionCompare(nodeVersion, '14') >= 0) {
			fsUtil.rm(
				path,
				{ recursive: true, force: true, maxRetries: 2 },
				wrappedNext,
			)
		} else if (
			versionCompare(nodeVersion, '12') >= 0 &&
			versionCompare(nodeVersion, '16') < 0
		) {
			fsUtil.rmdir(path, { recursive: true, maxRetries: 2 }, wrappedNext)
		} else {
			exec(`rm -rf ${JSON.stringify(path)}`, { cwd: cwd() }, wrappedNext)
		}
	},
}

// Add any missing methods
Object.keys(fsUtil).forEach(function (key) {
	const value = fsUtil[key]
	// we do the `!safefs[key]` as we don't want to over-write our own enhancements
	// we do the `value.bind` check, as we may interate across trivial types
	// we do the `Function.prototype.bind` check, as underscore is a function that has it's own bind
	if (!safefs[key] && value && value.bind === Function.prototype.bind) {
		safefs[key] = value.bind(fsUtil)
	}
})

// Export
module.exports = safefs
