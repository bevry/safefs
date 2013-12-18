# Import
fsUtil = require('graceful-fs')
pathUtil = require('path')


# =====================================
# Define Module

safefs =

	# =====================================
	# Open and Close Files

	# Open a file
	# Only here for backwards compatibility, do not use this
	openFile: (fn) ->
		console.log('safefs.openFile has been deprecated, we now do the opening and closing automatically through the graceful-fs module')

		# Chain
		fn()
		safefs

	# Close a file
	# Only here for backwards compatibility, do not use this
	closeFile: ->
		# Log
		console.log('safefs.closeFile has been deprecated, we now do the opening and closing automatically through the graceful-fs module')

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
			return next(null, true)  if exists

			# Success
			parentPath = safefs.getParentPathSync(path)
			safefs.ensurePath parentPath, options, (err) ->
				# Error
				return next(err, false)  if err

				# Success
				safefs.mkdir path, options.mode, (err) ->
					safefs.exists path, (exists) ->
						# Error
						if not exists
							err = new Error("Failed to create the directory: #{path}")
							return next(err, false)

						# Success
						next(null, false)

		# Chain
		safefs


	# =====================================
	# Safe Wrappers for Standard Methods

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
			fsUtil.writeFile(path, data, options, next)

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
			fsUtil.appendFile(path, data, options, next)

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
		fsUtil.mkdir(path, mode, next)

		# Chain
		safefs

	# Unlink
	# next(err)
	unlink: (path,next) ->
		# Stat
		safefs.exists path, (exists) ->
			return next()  if exists is false
			fsUtil.unlink(path, next)

		# Chain
		safefs

	# Exists
	# next(err)
	exists: (path,next) ->
		# Action
		(fsUtil.exists or pathUtil.exists)(path, next)

		# Chain
		safefs

	# Exits Sync
	# next(err)
	existsSync: (path) ->
		return (fsUtil.existsSync or pathUtil.existsSync)(path)


# Add any missing methods
for own key,value of fsUtil
	safefs[key] ?= value.bind(fsUtil)

# Export
module.exports = safefs