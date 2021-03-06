var express = require('express');
var router = express.Router();
var fs = require('fs');
var elasticsearch = require('elasticsearch');
const {getBrands, getModels} = require('node-car-api');


// connect to elasticsearch
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    //log: 'trace'
  });

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });

// router.get('/delete', function(req, res, next) {
//     client.deleteByQuery({
//         index: 'cardisiac'
//       }, function (error, response) {
//         if(error)
//         {
//             console.log(error);
//         }
//       });
//   res.json();
// });

router.get('/populate', function(req, res, next) {
    async function getBrandsName () {
        const brands = await getBrands();
        return brands;
    }

    getBrandsName().then((brands)=>{
        brands.forEach(async brand => {
            const models = await getModels(brand);
            if(models.length > 0)
            {
                models.forEach(model => {
                    if(model.volume !== (null || undefined))
                    {
                        let volume  = parseInt(model.volume);
                        model.volume = volume;
                        client.create({
                            index: 'cardisiac',
                            type: 'model',
                            id: model.uuid,
                            body: model
                          }, function (error, response) {
                            if(error)
                            {
                              console.log(error);
                            }
                        });
                    }
                });
            }
        });
    })

    res.render('index', { title: 'Express' });
  });
  
  router.get('/suv', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            size: 10,
            query: {
               match_all: {},
            },
            sort: {
                "volume.keyword": {
                    order: "desc"
                }
            }
        }
      }).then(function (res) {
            res.hits.hits.forEach(model => {
                results.push(model['_source']);
          });
      }, function (err) {
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });

  router.get('/suv/:quantity', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            size: req.params.quantity,
            query: {
               match_all: {},
            },
            sort: {
                "volume.keyword": {
                    order: "desc"
                }
            }
        }
      }).then(function (res) {
            res.hits.hits.forEach(model => {
                results.push(model['_source']);
          });
      }, function (err) {
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });

  router.get('/suv/page/:number', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            from: req.params.number * 10,
            size: 10,
            query: {
               match_all: {},
            },
            sort: {
                "volume.keyword": {
                    order: "desc"
                }
            }
        }
      }).then(function (res) {
            res.hits.hits.forEach(model => {
                results.push(model['_source']);
          });
      }, function (err) {
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });

  router.get('/suv/distinct/brands', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            size: 0,
            aggs: {
                brands: {
                    terms: {
                        field: "brand.keyword",
                        size: 500,
                        order: {
                            _key: "asc"
                        }
                    }
                }
            }
        }
      }).then(function (res) {
            res.aggregations.brands.buckets.forEach(brand => {
                results.push(brand.key);
          });
      }, function (err) {
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });  
  
  router.get('/suv/distinct/volume', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            size: 0,
            aggs: {
                brands: {
                    terms: {
                        field: "volume.keyword",
                        size: 500,
                        order: {
                            _key: "desc"
                        }
                    }
                }
            }
        }
      }).then(function (res) {
            res.aggregations.brands.buckets.forEach(brand => {
                results.push(brand.key);
          });
      }, function (err) {
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });


  router.get('/suv/searchByBrand/:brand/:minVolume/:maxVolume/:page', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            from: req.params.page * 10,
            size: 10,
            query: {
               bool: {
                   must: [
                       { match: { "brand.keyword": req.params.brand }},
                       { range: { "volume.keyword": { gte: req.params.minVolume, lte: req.params.maxVolume } }}
                   ]
               }
            },
            sort: {
                "volume.keyword": {
                    order: "desc"
                }
            }
        }
      }).then(function (res) {
            res.hits.hits.forEach(model => {
                results.push(model['_source']);
          });
      }, function (err) {s
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });


  router.get('/suv/searchByVolume/:minVolume/:maxVolume/:page', function(req, res, next) {
    let results = []
    client.search({
        index: 'cardisiac',
        type: 'model',
        body: {
            from: req.params.page * 10,
            size: 10,
            query: {
               bool: {
                   must: [
                       { range: { "volume.keyword": { gte: req.params.minVolume, lte: req.params.maxVolume } }}
                   ]
               }
            },
            sort: {
                "volume.keyword": {
                    order: "desc"
                }
            }
        }
      }).then(function (res) {
            res.hits.hits.forEach(model => {
                results.push(model['_source']);
          });
      }, function (err) {s
        console.trace(err.message);
      }).then(() => {
        res.json(results);
      });
  });

module.exports = router;
