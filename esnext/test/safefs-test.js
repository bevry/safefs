/* eslint no-sync:0 */

// Import
const {equal, errorEqual} = require('assert-helpers')
const joe = require('joe')
const rimraf = require('rimraf')
const safefs = require('../..')

// Prepare
const localDir = process.cwd() + '/tmp'
const localFile = localDir + '/1/2.txt'
const localSubDir = localDir + '/3/4'


// =====================================
// Tests

// Types
joe.describe('safefs', function (describe, it) {

	it('getParentPathSync', function () {
		equal(safefs.getParentPathSync('a/b/c.js'), 'a/b', 'should work with file')
		equal(safefs.getParentPathSync('a/b/c'), 'a/b', 'should work with directory without trailing slash')
		equal(safefs.getParentPathSync('a/b/c/'), 'a/b', 'should work with directory with trailing slash')
	})

	it('cleaning', function (complete) {
		rimraf(localDir, complete)
	})

	// test graceful-fs alias
	it('exists', function (complete) {
		safefs.exists(__dirname, function (exists) {
			equal(exists, true, 'this directory should exist')
			safefs.exists(localDir, function (exists) {
				equal(exists, false, 'this directory should not exist')
				complete()
			})
		})
	})

	// test graceful-fs alias
	it('existsSync', function () {
		equal(safefs.existsSync(__dirname), true, 'this directory should exist')
		equal(safefs.existsSync(localDir), false, 'this directory should not exist')
	})

	it('unlink', function () {
		safefs.unlink(localDir, function (err) {
			errorEqual(err, null, 'there should be no error when trying to unlink a path that doesn\'t exit')
		})
	})

	it('mkdir', function (complete) {
		safefs.mkdir(localDir, function (err) {
			errorEqual(err, null, 'there should be no error')
			safefs.exists(localDir, function (exists) {
				equal(exists, true, 'this directory should now exist')
				complete()
				// @TODO add a permission check on the path
			})
		})
	})

	// check writing a file that is in a path that doesn't exist
	it('writeFile', function (complete) {
		safefs.writeFile(localFile, 'abc', function (err) {
			errorEqual(err, null, 'there should be no error')
			// this also checks graceful-fs aliases
			safefs.readFile(localFile, function (err, data) {
				errorEqual(err, null, 'there should be no error')
				equal(data.toString(), 'abc', 'result data should be as expected')
				complete()
			})
		})
	})

	it('appendFile', function (complete) {
		safefs.appendFile(localFile, '123', function (err) {
			errorEqual(err, null, 'there should be no error')
			// this also checks graceful-fs aliases
			safefs.readFile(localFile, function (err, data) {
				errorEqual(err, null, 'there should be no error')
				equal(data.toString(), 'abc123', 'result data should be as expected')
				complete()
			})
		})
	})

	it('ensurePath', function (complete) {
		safefs.ensurePath(localSubDir, function (err, existed) {
			errorEqual(err, null, 'there should be no error')
			equal(existed, false, 'the directory should not have existed, so existed should be false')
			safefs.exists(localSubDir, function (exists) {
				equal(exists, true, 'the directory should now exist')
				safefs.ensurePath(localSubDir, function (err, existed) {
					errorEqual(err, null, 'there should be no error')
					equal(existed, true, 'the directory should now have existed')
					complete()
				})
			})
		})
	})

	it('cleaning', function (complete) {
		rimraf(localDir, complete)
	})

})
