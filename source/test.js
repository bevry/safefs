/* eslint no-sync:0 */
'use strict'

// @todo add windows support (use join for paths)

// Import
const tmpdir = require('os').tmpdir
const join = require('path').join
const suite = require('kava').suite
const assertUtil = require('assert-helpers')
const equal = assertUtil.equal
const nullish = assertUtil.nullish
const safefs = require('./index.js')

// Prepare
const localDir = join(tmpdir(), `bevry-safefs-${Math.random()}`)
const localFile = join(localDir, '1', '2.txt')
const localSubDir = join(localDir, '3', '4')

// =====================================
// Tests

// Types
suite('safefs', function (suite, test) {
	test('getParentPathSync', function () {
		equal(
			safefs.getParentPathSync(join('a', 'b', 'c.js')),
			join('a', 'b'),
			'should work with file',
		)
		equal(
			safefs.getParentPathSync(join('a', 'b', 'c')),
			join('a', 'b'),
			'should work with directory without trailing slash',
		)
		equal(
			safefs.getParentPathSync(join('a', 'b', 'c')),
			join('a', 'b'),
			'should work with directory with trailing slash',
		)
	})

	// test graceful-fs alias
	test('exists', function (complete) {
		safefs.exists(__dirname, function (exists) {
			equal(exists, true, 'this directory should exist')
			complete()
		})
	})

	// remove and confirm
	test('cleaning', function (complete) {
		safefs.rimraf(localDir, complete)
	})
	test('exists', function (complete) {
		safefs.exists(localDir, function (exists) {
			equal(exists, false, 'the directory should have been removed')
			complete()
		})
	})

	// test graceful-fs alias
	test('existsSync', function () {
		equal(safefs.existsSync(__dirname), true, 'this directory should exist')
		equal(safefs.existsSync(localDir), false, 'this directory should not exist')
	})

	test('unlink', function () {
		safefs.unlink(localDir, function (err) {
			nullish(
				err,
				"there should be no error when trying to unlink a path that doesn't exit",
			)
		})
	})

	test('mkdir', function (complete) {
		safefs.mkdir(localDir, function (err) {
			nullish(err, 'there should be no error')
			safefs.exists(localDir, function (exists) {
				equal(exists, true, 'this directory should now exist')
				complete()
				// @TODO add a permission check on the path
			})
		})
	})

	// check writing a file that is in a path that doesn't exist
	test('writeFile', function (complete) {
		safefs.writeFile(localFile, 'abc', function (err) {
			nullish(err, 'there should be no error')
			// this also checks graceful-fs aliases
			safefs.readFile(localFile, function (err, data) {
				nullish(err, 'there should be no error')
				equal(data.toString(), 'abc', 'result data should be as expected')
				complete()
			})
		})
	})

	test('appendFile', function (complete) {
		safefs.appendFile(localFile, '123', function (err) {
			nullish(err, 'there should be no error')
			// this also checks graceful-fs aliases
			safefs.readFile(localFile, function (err, data) {
				nullish(err, 'there should be no error')
				equal(data.toString(), 'abc123', 'result data should be as expected')
				complete()
			})
		})
	})

	test('ensurePath', function (complete) {
		safefs.ensurePath(localSubDir, function (err, existed) {
			nullish(err, 'there should be no error')
			equal(
				existed,
				false,
				'the directory should not have existed, so existed should be false',
			)
			safefs.exists(localSubDir, function (exists) {
				equal(exists, true, 'the directory should now exist')
				safefs.ensurePath(localSubDir, function (err, existed) {
					nullish(err, 'there should be no error')
					equal(existed, true, 'the directory should now have existed')
					complete()
				})
			})
		})
	})

	// remove and confirm
	test('cleaning', function (complete) {
		safefs.rimraf(localDir, complete)
	})
	test('exists', function (complete) {
		safefs.exists(localDir, function (exists) {
			equal(exists, false, 'the directory should have been removed')
			complete()
		})
	})
})
