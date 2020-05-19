
//(function () {

  var viz;

  $(document).ready(function () {

    // Set up the initial form with default values and dropdowns
    initViz();

    $("#testButton").click(function() {
      retrieveFilters();
    });

    $("#clearButton").click(function() {
      clearFiltersButton();
    });

    // When #clearFilterButton is clicked:
    $("#filtersTable").on("click", ".clearFilterButton", function() {

      let worksheetName = $(this).closest("tr").data("worksheet-name");
      let filterFieldName = $(this).closest("tr").data("filter-field-name");
      clearFilterButton(worksheetName, filterFieldName);

    });

  })

  function initViz() {
      var containerDiv = document.getElementById("vizContainer"),
          url = "https://10ax.online.tableau.com/t/chrishastieiwdev598367/views/embeddingLevel2/BasicDashboard?:showAppBanner=false&:display_count=n&:showVizHome=n&:origin=viz_share_link",
          options = {
              hideTabs: true,
              onFirstInteractive: function () {
                  retrieveFilters();
                  // Add event listener for filter changes
                  viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, retrieveFilters);
              }
          };

      viz = new tableau.Viz(containerDiv, url, options);
      // Create a viz object and embed it in the container div.

  }

  /*
  function getViz() {
    return new Promise(function(resolve, reject) {

      let viz = parent.parent.tableau.VizManager.getVizs()[0];

      resolve(viz);
      if (viz == undefined) {
        reject("Error");
      }
    });
  }
  */

  function getWorksheets(viz) {
    return new Promise(function(resolve, reject) {

      let worksheets = viz.getWorkbook().getActiveSheet().getWorksheets();

      resolve(worksheets);
      if (worksheets == undefined) {
        reject("Error");
      }
    });
  }

  function getWorksheetFiltersDict(worksheet) {
    return new Promise(function(resolve, reject) {

      worksheet.getFiltersAsync()
      .then(function(filters) {
        let worksheetFiltersDict = {
          worksheetName: worksheet.getName(),
          worksheet : worksheet,
          filters : filters
        }
        resolve(worksheetFiltersDict);
        if (worksheetFiltersDict == undefined) {
          reject("Error");
        }
      });

    });
  }

  function getWorksheetFiltersList(worksheets) {
    return new Promise(function(resolve, reject) {

      let worksheetCount = worksheets.length;
      let worksheetsProcessed = 0;
      let worksheetFiltersList = [];

      worksheets.forEach(
        function(worksheet){
          getWorksheetFiltersDict(worksheet)
          .then(function(worksheetFiltersDict) {
            worksheetFiltersList.push(worksheetFiltersDict);
            worksheetsProcessed++;
            if (worksheetsProcessed == worksheetCount) {
              resolve(worksheetFiltersList);
              if (worksheetFiltersList == undefined) {
                reject("Error");
              }
            }
          });
        }
      )
    });
  }

  function getAppliedValuesDict(filter) {
    return new Promise(function(resolve, reject) {

      let filterFieldName = filter.getFieldName();
      let appliedValues = filter.getAppliedValues();
      let isAllSelected = filter.getIsAllSelected();

      appliedFilterDict = {
        filterFieldName : filterFieldName,
        appliedValues : appliedValues,
        isAllSelected : isAllSelected
      }

      resolve(appliedFilterDict);
      if (appliedFilterDict == undefined) {
        reject("Error");
      }

    })
  }

  function getAllAppliedValues(filterList) {
    return new Promise(function(resolve, reject) {

      let filtersCount = filterList.length;
      let filtersProcessed = 0;
      let appliedValuesList = [];

      filterList.forEach(
        function(filter){
          getAppliedValuesDict(filter)
          .then(function(appliedValuesDict) {
            appliedValuesList.push(appliedValuesDict);
            filtersProcessed++;
            if (filtersProcessed == filtersCount) {
              resolve(appliedValuesList);
              if (appliedValuesList == undefined) {
                reject("Error");
              }
            }
          });
        }
      )
    });
  }

  function getWorksheetAppliedValuesDict(worksheetFiltersDict) {
    return new Promise(function(resolve, reject) {

      let filters = worksheetFiltersDict.filters;

      let filtersCount = filters.length;
      let filtersProcessed = 0;
      let appliedValuesList = [];

      filters.forEach(
        function(filter){
          getAppliedValuesDict(filter)
          .then(function(appliedValuesDict) {
            appliedValuesList.push(appliedValuesDict);
            filtersProcessed++;
            if (filtersProcessed == filtersCount) {
              let worksheetAppliedValuesDict = worksheetFiltersDict;
              worksheetAppliedValuesDict.appliedValues = appliedValuesList;

              resolve(worksheetAppliedValuesDict);
              if (worksheetAppliedValuesDict == undefined) {
                reject("Error");
              }
            }
          });
        }
      )
    });
  }

  function getWorksheetAppliedValuesList(worksheetFiltersList) {
    return new Promise(function(resolve, reject) {

      let worksheetFiltersCount = worksheetFiltersList.length;
      let worksheetFiltersProcessed = 0;
      let worksheetAppliedValuesList = [];

      worksheetFiltersList.forEach(
        function(worksheetFiltersDict){
          getWorksheetAppliedValuesDict(worksheetFiltersDict)
          .then(function(worksheetAppliedValuesDict) {
            worksheetAppliedValuesList.push(worksheetAppliedValuesDict);
            worksheetFiltersProcessed++;
            if (worksheetFiltersProcessed == worksheetFiltersCount) {
              resolve(worksheetAppliedValuesList);
              if (worksheetAppliedValuesList == undefined) {
                reject("Error");
              }
            }
          });
        }
      )
    });
  }

  function getCleanFiltersList(worksheetAppliedValuesList) {

    let cleanFiltersList = [];
    worksheetAppliedValuesList.forEach(
      function(worksheetAppliedValuesDict){
        let appliedFilterReadList = [];
        worksheetAppliedValuesDict.appliedValues.forEach(
          function(appliedValuesDict) {
            let isAllSelected = appliedValuesDict.isAllSelected;
            let appliedValuesList = []
            appliedValuesDict.appliedValues.forEach(
              function(appliedValueDict) {
                appliedValuesList.push(appliedValueDict.formattedValue);
              }
            )
            let appliedFilterReadDict = {
              filterFieldName : appliedValuesDict.filterFieldName,
              appliedValuesList : appliedValuesList,
              isAllSelected : isAllSelected
            }
            appliedFilterReadList.push(appliedFilterReadDict)

          }
        )
        let cleanFilterDict = {
          worksheetName: worksheetAppliedValuesDict.worksheetName,
          appliedFilters : appliedFilterReadList
        }
        cleanFiltersList.push(cleanFilterDict);
      }
    )
    return cleanFiltersList;
  }

  function clearTable(tableIdentifier) {
    $(tableIdentifier).find("tr:gt(0)").remove();
  }

  function addFilterRow(worksheetName, filterDict) {

    let clearFilterButtonHTML = "<button class=\"btn btn-secondary clearFilterButton\">Clear Filter</button>"

    let isAllSelected;
    if (filterDict.isAllSelected) {
      isAllSelected = "True"
    } else {
      isAllSelected = "False"
    }

    let rowHTML = "<tr data-worksheet-name = \""
    + worksheetName
    + "\" data-filter-field-name=\"" +
    filterDict.filterFieldName
    + "\"><td>" +
    worksheetName
    + "</td><td>" +
    filterDict.filterFieldName
    + "</td><td>" +
    isAllSelected
    + "</td><td>" +
    filterDict.appliedValuesList.join(", ")
    + "</td><td>" +
    clearFilterButtonHTML
    + "</td></tr>";

    $("#filtersTable").append(rowHTML);
  }

  function addFilterRows(cleanFiltersDict) {
    cleanFiltersDict.appliedFilters.forEach(
      function(appliedFilterDict) {
        addFilterRow(cleanFiltersDict.worksheetName, appliedFilterDict)
      }
    )
  }

  function addAllFilterRows(cleanFiltersList) {
    cleanFiltersList.forEach(
      function(cleanFilterDict) {
        addFilterRows(cleanFilterDict)
      }
    )
  }

  function populateFiltersTable(cleanFiltersList) {
    clearTable("#filtersTable");
    addAllFilterRows(cleanFiltersList);
  }

  function updateTextBox(text) {
    $("#filtersTextBox").val(text);
  }

  function retrieveFilters() {

    getWorksheets(viz)
    .then(function(worksheets){
      return getWorksheetFiltersList(worksheets)
    })
    .then(function(worksheetFiltersList){
      return getWorksheetAppliedValuesList(worksheetFiltersList)
    })
    .then(function(worksheetAppliedValuesList){
      let cleanFiltersList = getCleanFiltersList(worksheetAppliedValuesList);
      updateTextBox(JSON.stringify(cleanFiltersList))
      populateFiltersTable(cleanFiltersList)

    })

  }

  function getWorksheet(worksheets, worksheetName) {
    return new Promise(function(resolve, reject) {

      let worksheet = worksheets.get(worksheetName);

      resolve(worksheet);
      if (worksheet == undefined) {
        reject("Error");
      }
    });
  }

  function clearFilter(worksheet, filterFieldName) {
    return worksheet.applyFilterAsync(filterFieldName, "", tableau.FilterUpdateType.ALL)
  }

  function clearFilterButton(worksheetName, filterFieldName) {

    getWorksheets(viz)
    .then(function(worksheets){
      return getWorksheet(worksheets, worksheetName)
    })
    .then(function(worksheet) {
      clearFilter(worksheet, filterFieldName);
    })
    .then(function() {
      retrieveFilters();
    })
  }

  function clearFilters(worksheetFiltersDict) {
    return new Promise(function(resolve, reject) {

      let filters = worksheetFiltersDict.filters;
      let worksheet = worksheetFiltersDict.worksheet;

      filters.forEach(
        function(filter){
          let filterFieldName = filter.getFieldName();
          clearFilter(worksheet, filterFieldName)
          .then(resolve(0))
        }
      )
    });
  }

  function clearWorksheetFilters(worksheetFiltersList) {

    worksheetFiltersList.forEach(
      function(worksheetFiltersDict){
        clearFilters(worksheetFiltersDict)
      }
    )
  }

  function clearFiltersButton() {

    getWorksheets(viz)
    .then(function(worksheets){
      return getWorksheetFiltersList(worksheets)
    })
    .then(function(worksheetFiltersList){
      clearWorksheetFilters(worksheetFiltersList)
      return 0
    })
    .then(function(){
      retrieveFilters()
    })

  }
//})();
