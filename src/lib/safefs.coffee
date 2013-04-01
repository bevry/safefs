# Import
fsUtil = require('fs')
pathUtil = require('path')

# Create a counter of all the open files we have
# As the filesystem will throw a fatal error if we have too many open files
global.numberOfOpenFiles ?= 0
global.maxNumberOfOpenFiles ?= process.env.NODE_MAX_OPEN_FILES ? 100
global.waitingToOpenFileDelay ?= 100


# =====================================
# Define

safefs =

	# =====================================
	# Open and Close Files

	# Allows us to open files safely
	# by tracking the amount of open files we have

	# Open a file
	# Pass your callback to fire when it is safe to open the file
	openFile: (next) ->
		if global.numberOfOpenFiles < 0
			throw new Error("safefs.openFile: the numberOfOpenFiles is [#{global.numberOfOpenFiles}] which should be impossible...")
		if global.numberOfOpenFiles >= global.maxNumberOfOpenFiles
			setTimeout(
				-> safefs.openFile(next)
				global.waitingToOpenFileDelay
			)
		else
			++global.numberOfOpenFiles
			next()
		@

	# Close a file
	# Call this once you are done with that file
	closeFile: (next) ->
		--global.numberOfOpenFiles
		next?()
		@



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
		@



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
		safefs.openFile -> fsUtil.readFile path, options, (err,data) ->
			safefs.closeFile()
			return next(err,data)

		# Chain
		@

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
			safefs.openFile -> fsUtil.writeFile path, data, options, (err) ->
				safefs.closeFile()
				return next(err)

		# Chain
		@

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
			safefs.openFile -> fsUtil.appendFile path, data, options, (err) ->
				safefs.closeFile()
				return next(err)

		# Chain
		@

	# Mkdir
	# next(err)
	mkdir: (path,mode,next) ->
		# Prepare
		unless next?
			next = mode
			mode = null
		mode ?= (0o777 & (~process.umask()))

		# Action
		safefs.openFile -> fsUtil.mkdir path, mode, (err) ->
			safefs.closeFile()
			return next(err)

		# Chain
		@

	# Stat
	# next(err,stat)
	stat: (path,next) ->
		safefs.openFile -> fsUtil.stat path, (err,stat) ->
			safefs.closeFile()
			return next(err,stat)

		# Chain
		@

	# Readdir
	# next(err,files)
	readdir: (path,next) ->
		safefs.openFile ->
			fsUtil.readdir path, (err,files) ->
				safefs.closeFile()
				return next(err,files)

		# Chain
		@

	# Unlink
	# next(err)
	unlink: (path,next) ->
		# Stat
		safefs.openFile -> fsUtil.unlink path, (err) ->
			safefs.closeFile()
			return next(err)

		# Chain
		@

	# Rmdir
	# next(err)
	rmdir: (path,next) ->
		# Stat
		safefs.openFile -> fsUtil.rmdir path, (err) ->
			safefs.closeFile()
			return next(err)

		# Chain
		@

	# Exists
	# next(err)
	exists: (path,next) ->
		# Exists function
		exists = fsUtil.exists or pathUtil.exists

		# Action
		safefs.openFile -> exists path, (exists) ->
			safefs.closeFile()
			return next(exists)

		# Chain
		@

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