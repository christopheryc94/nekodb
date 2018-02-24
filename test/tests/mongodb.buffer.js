const test = require('tape')
const config = require('../config')

let refId = null
let refsIds = null

function setup (ko, next) {
	const Ref = ko.Model('Mongodb_buffer_ref', {
		string: ko.String,
	})
	const Model = ko.Model('Mongodb_buffer', {
		name: ko.String,
		ref: Ref,
		refs: [Ref],
	})

	Ref.create({string: 'deleteOne'}).save().then(() => {
		return Model.create({
			name: '01',
			ref: {
				string: 'string',
			},
			refs: [{
				string: 'other',
			}],
		}).saveAll()
	}).then(saved => {
		refId = saved.ref
		refsIds = saved.refs
		ko.close()
		ko.connect({
			client: 'mongodb',
			username: config.username,
			password: config.password,
			address: config.address,
			database: config.database,
		})
		runTests(ko, next)
	}).catch(err => {
		console.error(err)
	})
}

function runTests (ko, next) {
	console.log('hello0-0')
	test('Enqueue one of each operation', function (t) {
		console.log('hello')
		t.plan(6)

		const Ref = ko.Model('Mongodb_buffer_ref', {
			string: ko.String,
		})
		const Model = ko.Model('Mongodb_buffer', {
			name: ko.String,
			ref: Ref,
			refs: [Ref],
		})

		Model.count({}).then(count => {
			t.equal(count, 1, 'Counted documents')
		}).catch(err => {
			t.error(err)
		})

		Model.find({}).then(found => {
			t.deepEqual(found, [{
				_id: found[0]._id,
				name: '01',
				ref: refId,
				refs: refsIds,
			}], 'Found documents')
		}).catch(err => {
			t.error(err)
		})

		Model.find({}).sort({_id: 1}).skip(0).limit(1).join().then(found => {
			t.deepEqual(found, [{
				_id: found[0]._id,
				name: '01',
				ref: {
					_id: refId,
					string: 'string',
				},
				refs: [{
					_id: refsIds[0],
					string: 'other',
				}],
			}], 'Found, ran cursor methods, and joined documents')
		}).catch(err => {
			t.error(err)
		})

		Model.findOne({name: '01'}).then(found => {
			t.deepEqual(found, {
				_id: found._id,
				name: '01',
				ref: refId,
				refs: refsIds,
			}, 'Found document')
		}).catch(err => {
			t.error(err)
		})

		Ref.deleteOne({string: 'deleteOne'}).then(deleted => {
			t.equal(deleted, 1, 'Deleted ref with deleteOne')
		}).catch(err => {
			t.error(err)
		})

		Model.deleteMany({name: '01'}).then(deleted => {
			t.equal(deleted, 1, 'Deleted model with deleteMany')
		}).catch(err => {
			t.error(err)
		})
	})

	test('All done', function (t) {
		t.end()
		next()
	})
}

module.exports = setup
