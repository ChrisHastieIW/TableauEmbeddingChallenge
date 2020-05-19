
var tableauAPI = function(app) {

  const tableauHostName = "10ax.online.tableau.com";
  const tableauVersion = "3.8";
  const defaultPathStart = `/api/${tableauVersion}`

  const defaultOptions = {
    hostname: tableauHostName,
    port: 443,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  }

  function tableauAPIExecution (method, path, authToken, reqBody, responseFormat) {
    return new Promise(function(resolve, reject) {
      const https = require('https');

      let options = {
        "hostname" : defaultOptions.hostname,
        "path" : `${defaultPathStart}/${path}`,
        "port" : defaultOptions.port,
        "method" : method,
        "headers" : {
          "Content-Type" : defaultOptions.headers["Content-Type"],
          "Accept" : defaultOptions.headers.Accept
        }
      };

      if (authToken != undefined) {
        options.headers["X-Tableau-Auth"] = authToken;
      }

      let reqBodyString = "";
      if (reqBody != undefined) {
        reqBodyString = JSON.stringify(reqBody);
        options.headers["Content-Length"] = reqBodyString.length
      }

      console.log("-------------------")
      console.log("options")
      console.log(options)
      console.log("-------------------")
      console.log("reqBodyString")
      console.log(reqBodyString)

      let apiExecution = https.request(options, (res) => {

        var body = '';

        if (responseFormat == "base64") {
          res.setEncoding('base64');
          body = "data:" + res.headers["content-type"] + ";base64,";
        }

        res.on('data', function(d) {
          body += d;
        });

        res.on('end', function (){
          resolve(body);
        });
      })

      apiExecution.on('response', (req) => {
        console.log("")
        console.log("--------------------------")
        console.log(`endpoint: ${path}`)
        console.log(`statusCode: ${req.statusCode}`)
        console.log("--------------------------")
        if (req.statusCode != 200) {
          reject(Error(req.statusText));
        };
      });

      apiExecution.on('error', (error) => {
        console.error(error)
      });

      apiExecution.write(reqBodyString);
      apiExecution.end();
    })
  }

  function retrieveRecommendedViewIDs(recommendedViews) {
    let recommendedViewIDs = [];
    recommendedViews.forEach(function(recommendedView) {
      recommendedViewIDs.push(recommendedView.recommendedId)
    })
    return recommendedViewIDs;
  }

  function retrieveViews(authToken, siteID, viewIDs) {
    return new Promise(function(resolve, reject) {
      let counter = 0;
      let views = [];
      viewIDs.forEach(function(viewID) {
        // Get View
        tableauAPIExecution(
            "GET"
          , `sites/${siteID}/views/${viewID}`
          , authToken
          , undefined
          , "JSON"
        )
        .then(function(returnedBody) {
          let view = JSON.parse(returnedBody);
          views.push(view)
          counter++
          if (counter == viewIDs.length) {
            resolve(views);
          }
        })
      })
    })
  }

  function retrievePreviewImages(authToken, siteID, views) {
    return new Promise(function(resolve, reject) {
      let counter = 0;
      let previewImages = [];
      views.forEach(function(view) {
        // Get Preview Image
        tableauAPIExecution(
            "GET"
          , `sites/${siteID}/workbooks/${view.view.workbook.id}/views/${view.view.id}/previewImage`
          , authToken
          , undefined
          , "base64"
        )
        .then(function(returnedImage) {
          let previewImage = returnedImage
          let viewDict = {
            "name" : view.view.name,
            "contentUrl" : view.view.contentUrl,
            "previewImage" : previewImage
          }
          previewImages.push(viewDict)
          counter++
          if (counter == views.length) {
            resolve(previewImages);
          }
        })
      })
    })
  }

  app.post('/tableauAPI', function (req, res) {
    let credentials = {
      "credentials": req.body.credentials
    };

    // Sign in to REST API
    tableauAPIExecution(
        "POST"
      , "auth/signin"
      , undefined
      , credentials
      , "JSON"
    )
    .then(function(returnedBody){
      let authTokenFull = JSON.parse(returnedBody)
      const authToken = authTokenFull.credentials.token;
      const siteID = authTokenFull.credentials.site.id;

      // Retrieve recommended views
      tableauAPIExecution(
          "GET"
        , `sites/${siteID}/recommendations/?type=view`
        , authToken
        , undefined
        , "JSON"
      )
      .then(function(returnedBody) {
        let recommendedViews = JSON.parse(returnedBody).recommendations.recommendation

        let recommendedViewIDs = retrieveRecommendedViewIDs(recommendedViews);

        // Retrieve view for each recommended view ID
        retrieveViews(authToken, siteID, recommendedViewIDs)
        .then(function(views) {
          retrievePreviewImages(authToken, siteID, views)
          .then(function(previewImages) {
            console.log("--------------------------");
            console.log(`previewImages Length: ${previewImages.length}`)

            res.header("Access-Control-Allow-Origin", "*");
            //res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
            res.header("Access-Control-Allow-Headers", "*");
            res.send(previewImages);
          })
        })
      })

    });
  });
}

module.exports = tableauAPI;
