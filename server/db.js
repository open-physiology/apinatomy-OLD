'use strict';


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var mongoose = require('mongoose');
var _ = require('lodash');
var vars = require('./vars');


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Connect with Mongo ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

mongoose.connect(vars.dbServer, vars.dbName);


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Convenience Definitions //////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function BooleanType(other) {
	return _.assign({
		type:    Boolean,
		default: false
	}, other);
}

function StringType(other) {
	return _.assign({
		type:    String,
		default: '',
		trim:    true
	}, other);
}

function StringEnum() {
	return {
		type: String,
		trim: true,
		enum: _.toArray(arguments)
	};
}

function NumberType(other) {
	return _.assign({
		type:    Number,
		default: -1
	}, other);
}

function EntityReference(other) {
	return StringType(_.assign({ ref: 'Entity' }, other));
}

function ProteinReference(other) {
	return StringType(_.assign({ ref: 'Protein' }, other));
}

function GeneTranslationReference(other) {
	return StringType(_.assign({ ref: 'GeneTranslation' }, other));
}

function SmallMoleculeReference(other) {
	return StringType(_.assign({ ref: 'SmallMolecule' }, other));
}


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Schemas //////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//// sub-schemas

var subEntitySchema = new mongoose.Schema({
	entity: EntityReference(),
	type:   StringEnum('regional part', 'constitutional part', 'subclass', 'seed')
});

var subExternalSchema = new mongoose.Schema({
	external: {
		_id:  StringType(),
		name: StringType(),
		type: StringType()
	},
	type:     StringType()
});

var subProteinInteractionSchema = new mongoose.Schema({
	interaction: [StringType()]
});


//// main schemas

var entitySchema = new mongoose.Schema({
	_id:                 StringType({ unique: true }),
	name:                StringType(),
	description:         StringType(),
	sub:                 [subEntitySchema],
	super:               [EntityReference()],
	externals:           [subExternalSchema],
	proteins:            [ProteinReference()],
	proteinInteractions: [subProteinInteractionSchema],
	reachable:           BooleanType(),
	descendantCount:     NumberType({ default: -1 }),
	tile:                mongoose.Schema.Types.Mixed,
	tileMap:             mongoose.Schema.Types.Mixed
}, { _id: false });
// TODO: use mongoose to add text-search index; now using `db.entities.ensureIndex({ _id: 'text', name: 'text' })`
entitySchema.index({ externals: 1 });

var unitSchema = new mongoose.Schema({
	_id:         StringType({ unique: true }),
	name:        StringType(),
	description: StringType(),
	externals:   [subExternalSchema]
}, { _id: false });

var connectionSchema = new mongoose.Schema({
	from:      EntityReference(),
	to:        EntityReference(),
	segmentId: StringType(),
	type:      StringType(),
	subtype:   StringType(),
	entity:    EntityReference(),
	name:      StringType(),
	species:   StringType()
});
connectionSchema.index({ type: 1, from: 1, to: 1, species: 1 }, { unique: true });
connectionSchema.index({ type: 1, from: 1, to: 1 });
connectionSchema.index({ from: 1, to: 1 });
connectionSchema.index({ segmentId: 1 });
connectionSchema.index({ type: 1 });

var pathSchema = new mongoose.Schema({
	from:    EntityReference(),
	to:      EntityReference(),
	path:    [EntityReference()],
	type:    StringType(),
	subtype: StringType()
});
pathSchema.index({ type: 1, from: 1, to: 1 }, { unique: true });
pathSchema.index({ from: 1, to: 1 });
pathSchema.index({ type: 1 });

var metadataSchema = new mongoose.Schema({
	entity:       EntityReference(),
	type:         StringType(),
	externalType: StringType(),
	eid:          StringType(),
	name:         StringType()
}, { collection: 'metadata' });
metadataSchema.index({ entity: 1 });
metadataSchema.index({ type: 1 });
metadataSchema.index({ externalType: 1 });
metadataSchema.index({ entity: 1, type: 1, eid: 1 }, { unique: true });

var proteinSchema = new mongoose.Schema({
	_id:                       StringType({ unique: true }),
	ensembl:                   StringType(),
	swissprot:                 StringType(),
	info:                      mongoose.Schema.Types.Mixed,
	smallMoleculeInteractions: [SmallMoleculeReference()],
	translations:              [GeneTranslationReference()]
});
proteinSchema.index({ ensembl: 1 });
proteinSchema.index({ swissprot: 1 });

var geneTranslationSchema = new mongoose.Schema({
	_id:     StringType({ unique: true }),
	ensembl: StringType(),
	length:  NumberType(),
	domains: [{
		          start: NumberType(),
		          end: NumberType(),
		          type: StringType(),
		          pfam_id: StringType(),
		          pfam_name: StringType()
	          }]
});

var smallMoleculeSchema = new mongoose.Schema({
	_id:  StringType({ unique: true }),
	info: mongoose.Schema.Types.Mixed
});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Models ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

exports.Entity = mongoose.model('Entity', entitySchema);
exports.Unit = mongoose.model('Unit', unitSchema);
exports.Connection = mongoose.model('Connection', connectionSchema);
exports.Path = mongoose.model('Path', pathSchema);
exports.Metadata = mongoose.model('Metadata', metadataSchema);
exports.Protein = mongoose.model('Protein', proteinSchema);
exports.GeneTranslation = mongoose.model('GeneTranslation', geneTranslationSchema);
exports.SmallMolecule = mongoose.model('SmallMolecule', smallMoleculeSchema);