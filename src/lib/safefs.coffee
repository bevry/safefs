# Import
fsUtil = require('fs')
pathUtil = require('path')
{TaskGroup} = require('taskgroup')


# =====================================
# Define Globals

# Prepare
global.safefsGlobal ?= {}

# Define Global Pool
# Create a pool with the concurrency of our max number of open files
global.safefsGlobal.pool ?= new TaskGroup().setConfig({
	concurrency: process.env.NODE_MAX_OPEN_FILES ? 100
	pauseOnError: false
}).run()


# =====================================
# Define Module

safefs =

	# =====================================
	# Open and Close Files

	# Open a file
	# Pass your callback to fire when it is safe to open the file
	openFile: (fn) ->
		# Add the task to the pool and execute it right away
		global.safefsGlobal.pool.addTask(fn)
		
		# Chain
		safefs

	# Close a file
	# Only here for backwards compatibility, do not use this
	closeFile: ->
		# Log
		console.log('safefs.closeFile has been deprecated, please use the safefs.openFile completion callback to close files')
		
		# Chain
		safefs


	# =====================================
	# Our own custom functions

	# Get the parent path
	getParentPathSync: (p) ->
		parentPath = p
			.replace(/[\/\\]$/, '') # remove trailing slashes
			.replace(/[\/\\][^\/\\]+$/, '')  # remove last directory
		return parentPath


	# Ensure path exists
	# next(err,exists)
	ensurePath: (path,options,next) ->
		# Prepare
		unless next?
			next = options
			options = null
		options ?= {}
		options.mode ?= null

		# Check
		safefs.exists path, (exists) ->
			# Error
			return next(null,true)  if exists

			# Success
			parentPath = safefs.getParentPathSync(path)
			safefs.ensurePath parentPath, options, (err) ->
				# Error
				return next(err,false)  if err

				# Success
				safefs.mkdir path, options.mode, (err) ->
					safefs.exists path, (exists) ->
						# Error
						if not exists
							err = new Error("Failed to create the directory: #{path}")
							return next(err,false)

						# Success
						next(null,false)

		# Chain
		safefs



	# =====================================
	# Safe Wrappers for Standard Methods

	# Read File
	# next(err)
	readFile: (path,options,next) ->
		# Prepare
		unless next?
			next = options
			options = null

		# Read
		safefs.openFile (closeFile) ->
			fsUtil.readFile path, options, (err,data) ->
				closeFile()
				return next(err,data)

		# Chain
		safefs

	# Write File
	# next(err)
	writeFile: (path,data,options,next) ->
		# Prepare
		unless next?
			next = options
			options = null

		# Ensure path
		safefs.ensurePath pathUtil.dirname(path), options, (err) ->
			# Error
			return next(err)  if err

			# Write data
			safefs.openFile (closeFile) ->
				fsUtil.writeFile path, data, options, (err) ->
					closeFile()
					return next(err)

		# Chain
		safefs

	# Append File
	# next(err)
	appendFile: (path,data,options,next) ->
		# Prepare
		unless next?
			next = options
			options = null

		# Ensure path
		safefs.ensurePath pathUtil.dirname(path), options, (err) ->
			# Error
			return next(err)  if err

			# Write data
			safefs.openFile (closeFile) ->
				fsUtil.appendFile path, data, options, (err) ->
					closeFile()
					return next(err)

		# Chain
		safefs

	# Mkdir
	# next(err)
	mkdir: (path,mode,next) ->
		# Prepare
		unless next?
			next = mode
			mode = null
		mode ?= (0o777 & (~process.umask()))

		# Action
		safefs.openFile (closeFile) ->
			fsUtil.mkdir path, mode, (err) ->
				closeFile()
				return next(err)

		# Chain
		safefs

	# Stat
	# next(err,stat)
	stat: (path,next) ->
		safefs.openFile (closeFile) ->
			fsUtil.stat path, (err,stat) ->
				closeFile()
				return next(err,stat)

		# Chain
		safefs

	# Readdir
	# next(err,files)
	readdir: (path,next) ->
		safefs.openFile (closeFile) ->
			fsUtil.readdir path, (err,files) ->
				closeFile()
				return next(err,files)

		# Chain
		safefs

	# Unlink
	# next(err)
	unlink: (path,next) ->
		# Stat
		safefs.openFile (closeFile) ->
			fsUtil.unlink path, (err) ->
				closeFile()
				return next(err)

		# Chain
		safefs

	# Rmdir
	# next(err)
	rmdir: (path,next) ->
		# Stat
		safefs.openFile (closeFile) ->
			fsUtil.rmdir path, (err) ->
				closeFile()
				return next(err)

		# Chain
		safefs

	# Exists
	# next(err)
	exists: (path,next) ->
		# Exists function
		exists = fsUtil.exists or pathUtil.exists

		# Action
		safefs.openFile (closeFile) ->
			exists path, (exists) ->
				closeFile()
				return next(exists)

		# Chain
		safefs

	# Exits Sync
	# next(err)
	existsSync: (path) ->
		# Exists function
		existsSync = fsUtil.existsSync or pathUtil.existsSync

		# Action
		result = existsSync(path)

		# Return
		result

# Export
module.exports = safefs