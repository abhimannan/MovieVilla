const Joi = require('joi');

const movieSchemaValidation = Joi.object({
    Movie : Joi.object({
        title : Joi.string().required(),
        director : Joi.string().required(),
        rating : Joi.number().required(),
        hero : Joi.string().required(),
        imageURL : Joi.string().allow('',null)
    }).required()
});

const reviewValidation = Joi.object({
    Review : Joi.object({
        description : Joi.string().required(),
        rating : Joi.number().required(),
    }).required()
});

module.exports = {movieSchemaValidation,reviewValidation};