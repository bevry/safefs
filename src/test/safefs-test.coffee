# Import
{expect} = require('chai')
joe = require('joe')
safefs = require('../..')
TaskGroup = require('taskgroup')

# Test
joe.describe 'safefs', (describe,it) ->

	it 'should open the max number of files, then queue, then wind down', (done) ->
		# Prepare
		tasks = new TaskGroup (err) ->
			# Check everything closed down correctly
			expect(err).to.not.exist
			expect(global.numberOfOpenFiles).to.equal(0)

			# Complete test
			done()

		# Add all our open tasks
		[1..global.maxNumberOfOpenFiles*2].forEach (i) ->  tasks.push (complete) ->
			# Open
			safefs.openFile ->
				# Check for logical conditions
				expect(global.numberOfOpenFiles).to.be.lte(global.maxNumberOfOpenFiles)

				# Delay would go here if we are over the limit
				process.nextTick ->
					# Check for logical conditions
					expect(global.numberOfOpenFiles).to.be.lte(global.maxNumberOfOpenFiles)

					# Close the file
					safefs.closeFile()

					# Complete the task
					complete()

			# Check for no delay
			if i < global.maxNumberOfOpenFiles
				expect(global.numberOfOpenFiles).to.equal(i)

			# Check for logical conditions
			expect(global.numberOfOpenFiles).to.be.lte(global.maxNumberOfOpenFiles)

		# Run all the tasks together
		tasks.run()
