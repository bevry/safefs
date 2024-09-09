/* eslint no-sync:0 */
'use strict'

// @todo add windows support (use join for paths)

// Import
const os = require('os')
const join = require('path').join
const suite = require('kava').suite
const assertUtil = require('assert-helpers')
const equal = assertUtil.equal
const nullish = assertUtil.nullish
const safefs = require('./index.js')

// Prepare
const localDir = join(os.tmpdir(), `bevry-safefs-${Math.random()}`)
const localFile = join(localDir, '1', '2.txt')
const localSubDir = join(localDir, '3', '4')
const localCopyDir = join(localDir, 'copy')
const localCopyFile = join(localCopyDir, '1', '2.txt')
const localMoveDir = join(localDir, 'move')
const localMoveFile = join(localMoveDir, '1', '2.txt')

// =====================================
// Tests

// Types
suite('safefs', function (suite, test) {
    // Original test cases
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

    test('exists', function (complete) {
        safefs.exists(__dirname, function (exists) {
            equal(exists, true, 'this directory should exist')
            complete()
        })
    })

    test('cleaning', function (complete) {
        safefs.rimraf(localDir, complete)
    })

    test('exists after cleaning', function (complete) {
        safefs.exists(localDir, function (exists) {
            equal(exists, false, 'the directory should have been removed')
            complete()
        })
    })

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
            })
        })
    })

    test('writeFile', function (complete) {
        safefs.writeFile(localFile, 'abc', function (err) {
            nullish(err, 'there should be no error')
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

    test('cleaning again', function (complete) {
        safefs.rimraf(localDir, complete)
    })

    test('exists after second cleaning', function (complete) {
        safefs.exists(localDir, function (exists) {
            equal(exists, false, 'the directory should have been removed')
            complete()
        })
    })

    // New test cases for added functionality
    test('setup for new tests', function (complete) {
        safefs.ensurePath(join(localDir, '1'), function (err) {
            nullish(err, 'there should be no error creating the directory')
            safefs.writeFile(localFile, 'abc123', function (err) {
                nullish(err, 'there should be no error writing the file')
                complete()
            })
        })
    })

    test('readdir', function (complete) {
        safefs.readdir(join(localDir, '1'), function (err, files) {
            nullish(err, 'there should be no error reading the directory')
            equal(files.length, 1, 'there should be one file in the directory')
            equal(files[0], '2.txt', 'the file should be named 2.txt')
            complete()
        })
    })

    test('isDirectory', function (complete) {
        safefs.isDirectory(localDir, function (err, isDir) {
            nullish(err, 'there should be no error checking if it is a directory')
            equal(isDir, true, 'localDir should be a directory')
            safefs.isDirectory(localFile, function (err, isDir) {
                nullish(err, 'there should be no error checking if it is a directory')
                equal(isDir, false, 'localFile should not be a directory')
                complete()
            })
        })
    })

    test('copy file', function (complete) {
        safefs.copy(localFile, localCopyFile, function (err) {
            nullish(err, 'there should be no error copying the file')
            safefs.readFile(localCopyFile, function (err, data) {
                nullish(err, 'there should be no error reading the copied file')
                equal(data.toString(), 'abc123', 'copied file content should match original')
                complete()
            })
        })
    })

    test('copy directory', function (complete) {
        safefs.copy(join(localDir, '1'), join(localCopyDir, '1'), function (err) {
            nullish(err, 'there should be no error copying the directory')
            safefs.exists(localCopyFile, function (exists) {
                equal(exists, true, 'copied file should exist in the new directory')
                complete()
            })
        })
    })

    test('move file', function (complete) {
        safefs.move(localFile, localMoveFile, function (err) {
            nullish(err, 'there should be no error moving the file')
            safefs.exists(localFile, function (exists) {
                equal(exists, false, 'original file should no longer exist')
                safefs.readFile(localMoveFile, function (err, data) {
                    nullish(err, 'there should be no error reading the moved file')
                    equal(data.toString(), 'abc123', 'moved file content should match original')
                    complete()
                })
            })
        })
    })

    test('move directory', function (complete) {
        safefs.move(join(localCopyDir, '1'), join(localMoveDir, 'copied'), function (err) {
            nullish(err, 'there should be no error moving the directory')
            safefs.exists(join(localCopyDir, '1'), function (exists) {
                equal(exists, false, 'original copy directory should no longer exist')
                safefs.exists(join(localMoveDir, 'copied', '2.txt'), function (exists) {
                    equal(exists, true, 'moved file should exist in the new directory')
                    complete()
                })
            })
        })
    })

    // Final cleanup
    test('final cleaning', function (complete) {
        safefs.rimraf(localDir, complete)
    })
})