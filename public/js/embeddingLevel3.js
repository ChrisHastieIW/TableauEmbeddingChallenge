
//(function () {

  var viz;

  $(document).ready(function () {

    // Set up the initial form with default values and dropdowns
    //initViz();

    $("#retrieveRecommendedViewsButton").click(function() {
      retrieveRecommendedViews();
    });

    // When #viewImage is clicked
    $("#recommendedViewsWrapper").on("click", ".viewImage", function() {

      let contentUrl = $(this).attr("id");

      initViz(contentUrl)

    });

  })

  function initViz(vizURL) {

    var containerDiv = document.getElementById("vizContainer"),
        url = `${vizURL}?:showAppBanner=false&:display_count=n&:showVizHome=n&:origin=viz_share_link`,
        options = {
            hideTabs: true,
            onFirstInteractive: function () {
                // Add event listener for filter changes
            }
        };

    if (viz != undefined) {viz.dispose();}

    viz = new tableau.Viz(containerDiv, url, options);
    // Create a viz object and embed it in the container div.

  }

  function httpGetAsync(url, body, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", url, true); // true for asynchronous
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.setRequestHeader("Access-Control-Allow-Origin", "*");
    xmlHttp.setRequestHeader("Access-Control-Allow-Headers", "*")
    xmlHttp.send(body);
  }

  function retrieveRecommendedViews() {
    let username = $("#username").val()
    let password = $("#password").val()

    let requestBody = {
      "credentials": {
        "name": username,
        "password": password,
        "site": {
          "contentUrl": "chrishastieiwdev598367"
        }
      }
    }

    console.log(requestBody)

    let localWebServerUrl = "http://localhost:3002/tableauAPI";

    httpGetAsync(localWebServerUrl, JSON.stringify(requestBody), displayRecommendedViews)
  }

  function appendToRecommendedViewsWrapper (name, contentURL, previewImage) {

    const imagesWidth = 200//740 / imageURLs.length;
    const imagesHeight = 140;

    //<a href=${contentURL} target="_blank">
    $('#recommendedViewsWrapper').append(`<img src="${previewImage}" width="${imagesWidth}px" height="${imagesHeight}px" alt="${name}" id="${contentURL}" class="viewImage">`);

  };

  function displayRecommendedViews(recommendedViewsString) {
    let recommendedViews = JSON.parse(recommendedViewsString);
    console.log(recommendedViews)
    $('#recommendedViewsWrapper').empty();
    recommendedViews.forEach(function(recommendedView){
      let name = recommendedView.name;
      let contentUrl = `https://10ax.online.tableau.com/t/chrishastieiwdev598367/views/${recommendedView.contentUrl.replace("/sheets/", "/")}`;
      let previewImage = recommendedView.previewImage;
      appendToRecommendedViewsWrapper(name, contentUrl, previewImage)
    })
  }

//})();
