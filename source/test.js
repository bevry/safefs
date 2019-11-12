/* eslint no-sync:0 */
'use strict'

// Import
const { equal, nullish } = require('assert-helpers')
const { suite } = require('kava')
const rimraf = require('rimraf')
const safefs = require('./')

// Prepare
const localDir = process.cwd() + '/tmp'
const localFile = localDir + '/1/2.txt'
const localSubDir = localDir + '/3/4'

// =====================================
// Tests

// Types
suite('safefs', function(suite, test) {
	test('getParentPathSync', function() {
		equal(safefs.getParentPathSync('a/b/c.js'), 'a/b', 'should work with file')
		equal(
			safefs.getParentPathSync('a/b/c'),
			'a/b',
			'should work with directory without trailing slash'
		)
		equal(
			safefs.getParentPathSync('a/b/c/'),
			'a/b',
			'should work with directory with trailing slash'
		)
	})

	test('cleaning', function(complete) {
		rimraf(localDir, complete)
	})

	// test graceful-fs alias
	test('exists', function(complete) {
		safefs.exists(__dirname, function(exists) {
			equal(exists, true, 'this directory should exist')
			safefs.exists(localDir, function(exists) {
				equal(exists, false, 'this directory should not exist')
				complete()
			})
		})
	})

	// test graceful-fs alias
	test('existsSync', function() {
		equal(safefs.existsSync(__dirname), true, 'this directory should exist')
		equal(safefs.existsSync(localDir), false, 'this directory should not exist')
	})

	test('unlink', function() {
		safefs.unlink(localDir, function(err) {
			nullish(
				err,
				"there should be no error when trying to unlink a path that doesn't exit"
			)
		})
	})

	test('mkdir', function(complete) {
		safefs.mkdir(localDir, function(err) {
			nullish(err, 'there should be no error')
			safefs.exists(localDir, function(exists) {
				equal(exists, true, 'this directory should now exist')
				complete()
				// @TODO add a permission check on the path
			})
		})
	})

	// check writing a file that is in a path that doesn't exist
	test('writeFile', function(complete) {
		safefs.writeFile(localFile, 'abc', function(err) {
			nullish(err, 'there should be no error')
			// this also checks graceful-fs aliases
			safefs.readFile(localFile, function(err, data) {
				nullish(err, 'there should be no error')
				equal(data.toString(), 'abc', 'result data should be as expected')
				complete()
			})
		})
	})

	test('appendFile', function(complete) {
		safefs.appendFile(localFile, '123', function(err) {
			nullish(err, 'there should be no error')
			// this also checks graceful-fs aliases
			safefs.readFile(localFile, function(err, data) {
				nullish(err, 'there should be no error')
				equal(data.toString(), 'abc123', 'result data should be as expected')
				complete()
			})
		})
	})

	test('ensurePath', function(complete) {
		safefs.ensurePath(localSubDir, function(err, existed) {
			nullish(err, 'there should be no error')
			equal(
				existed,
				false,
				'the directory should not have existed, so existed should be false'
			)
			safefs.exists(localSubDir, function(exists) {
				equal(exists, true, 'the directory should now exist')
				safefs.ensurePath(localSubDir, function(err, existed) {
					nullish(err, 'there should be no error')
					equal(existed, true, 'the directory should now have existed')
					complete()
				})
			})
		})
	})

	test('cleaning', function(complete) {
		rimraf(localDir, complete)
	})
})
