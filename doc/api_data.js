define({ api: [
  {
    "type": "get",
    "url": "/admin/login",
    "title": "Authenticates user",
    "version": "0.0.1",
    "name": "GetLogin",
    "group": "Authentication",
    "description": "User can only login via the web. Use the provided URI to access the application via Dropbox.",
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/admin/callback",
    "title": " Authentication callback",
    "version": "0.0.1",
    "name": "GetLoginCallback",
    "group": "Authentication",
    "description": "Dropbox will callback to this URI to complete the login process within the API.",
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/folders",
    "title": "Returns a list of folders",
    "version": "0.0.1",
    "name": "GetFolders",
    "group": "Folders",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String[]",
            "field": "data",
            "optional": false,
            "description": "Results within a specific folder in form of JSON."
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "   HTTP/1.1 200 OK\n   {\n   }\n"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NoFoldersFound",
            "optional": false,
            "description": "There are no folders found."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 404 Not Found\n   {\n     \"No Folders found\"\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/folders/:id",
    "title": "Returns results from a specific folder",
    "version": "0.0.1",
    "name": "GetFoldersWithId",
    "group": "Folders",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "A specific identifier."
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String[]",
            "field": "data",
            "optional": false,
            "description": "Results within a specific folder in form of JSON."
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "   HTTP/1.1 200 OK\n   {\n   }\n"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NoSearchesFound",
            "optional": false,
            "description": "There are no searches stored."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 404 Not Found\n   {\n     \"Folder '3' Not Found\"\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/",
    "title": "Base API URI",
    "version": "0.0.1",
    "name": "GetBase",
    "group": "General",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "BadRequest",
            "optional": false,
            "description": "There's nothing here."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 400 Bad Request\n   {\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/query/:query",
    "title": "Queries news sources and returns results from these sources.",
    "version": "0.0.1",
    "name": "GetQuery",
    "group": "Query",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "query",
            "optional": false,
            "description": "A specific query."
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "Identifier of the search query."
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "field": "articles",
            "optional": false,
            "description": "Articles with results in JSON."
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "   HTTP/1.1 200 OK\n   {\n\t\t\"id\": \"_17ahev6k9i0_js_kUa2d\",\n\t  \t\"articles\": [\n\t    {\n\t      \"url\": \"http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html\",\n\t      \"source\": \"The New York Times\",\n\t      \"headline\": \"In Rodriguez Arbitration, Two Sides Play Hardball\",\n\t      \"snippet\": \"In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.\",\n\t      \"pub_date\": \"2013-11-04T00:00:00Z\",\n\t      \"section_name\": \"Sports\",\n\t      \"type_of_material\": \"News\"\n\t    },\n\t    {\n\t      \"url\": \"http://select.nytimes.com/gst/abstract.html?res=9D03E0DC1531E63ABC4952DFBE66838C649EDE\",\n\t      \"source\": \"The New York Times\",\n\t      \"headline\": \"Major Sports News\",\n\t      \"snippet\": \"Don Drysdale pitched a sevenhitter yesterday as the Dodgers shut out the Pirates, 3 to 0. The Yankees defeated the Orioles,...\",\n\t      \"pub_date\": \"1957-08-11T00:00:00Z\",\n\t      \"section_name\": null,\n\t      \"type_of_material\": \"Front Page\"\n\t    },\n\t    {\n\t      \"url\": \"http://www.nytimes.com/1985/11/15/sports/transactions-156837.html\",\n\t      \"source\": \"The New York Times\",\n\t      \"headline\": \"Transactions\",\n\t      \"snippet\": \"  BOSTON (AL) -Released Jim Dorsey, pitcher. Assigned Dave Sax, catcher, and LaSchelle Tarver and Gus Burgess, outfielders, to Pawtucket of the International League.\",\n\t      \"pub_date\": \"1985-11-15T00:00:00Z\",\n\t      \"section_name\": \"Sports\",\n\t      \"type_of_material\": \"List\"\n\t    },\n\t    ...\n   }\n"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "ArticlesNotFound",
            "optional": false,
            "description": "The articles were not found."
          },
          {
            "group": "Error 4xx",
            "field": "BadParameters",
            "optional": false,
            "description": "Search used bad parameters."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 404 Not Found\n   {\n     \"Articles Not Found\"\n   }\n"
        },
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 400 Bad Content\n   {\n     \"Bad Parameters\"\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "post",
    "url": "/searches/:id",
    "title": "Saves a specific index (result) to a folder from a specific query",
    "version": "0.0.1",
    "name": "SaveResult",
    "group": "Save",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "A specific identifier."
          },
          {
            "group": "Parameter",
            "type": "Number",
            "field": "index",
            "optional": false,
            "description": "Position of article in question."
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "folder",
            "optional": false,
            "description": "Name of folder."
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "Confirmation",
            "optional": false,
            "description": "of saved index in specified folder"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "   HTTP/1.1 200 OK\n   {\n\t\t\"Index: '2' of search '_17ahd0srgi0_js_GXae' saved\"\n   }\n"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "SearchIdNotFound",
            "optional": false,
            "description": "Search results cannot be found with the id provided."
          },
          {
            "group": "Error 4xx",
            "field": "InvalidParameters",
            "optional": false,
            "description": "Invalid Index or Folder Parameters."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 404 Not Found\n   {\n     \"Search Id Not Found\"\n   }\n"
        },
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 400 Bad request\n   {\n     \"Invalid Parameters\"\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/searches",
    "title": "Returns a list of searches",
    "version": "0.0.1",
    "name": "GetSearches",
    "group": "Search",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "Identifier of the search query."
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "field": "data",
            "optional": false,
            "description": "Data returned as stored results."
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "   HTTP/1.1 200 OK\n   {\n\t\t\"id\": \"_17ahd0srgi0_js_GXaeN\",\n \t\t\"data\": {\n   \t\t\t\"date\": \"2013-11-07T00:22:12.200Z\",\n   \t\t\t\"query\": \"baseball\",\n   \t\t\t\"articles\": [\n     \t\t{\n       \t\t\t\"url\": \"http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html\",\n       \t\t\t\"source\": \"The New York Times\",\n       \t\t\t\"headline\": \"In Rodriguez Arbitration, Two Sides Play Hardball\",\n       \t\t\t\"snippet\": \"In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.\",\n       \t\t\t\"pub_date\": \"2013-11-04T00:00:00Z\",\n       \t\t\t\"section_name\": \"Sports\",\n       \t\t\t\"type_of_material\": \"News\"\n     \t\t},\n     \t\t...\n     \t}\n   }\n"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "NoSearchesFound",
            "optional": false,
            "description": "There are no searches stored."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 404 Not Found\n   {\n     \"No searches found\"\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  },
  {
    "type": "get",
    "url": "/searches/:id",
    "title": "Returns a specific result from a search",
    "version": "0.0.1",
    "name": "GetSearchesWithId",
    "group": "Search",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "A specific identifier."
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String[]",
            "field": "N",
            "optional": false,
            "description": "/A Search result in form of JSON."
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "   HTTP/1.1 200 OK\n   {\n\t\t{\n\t    \t\"url\": \"http://www.nytimes.com/2013/11/04/sports/baseball/in-rodriguez-arbitration-two-sides-play-hardball.html\",\n\t    \t\"source\": \"The New York Times\",\n\t    \t\"headline\": \"In Rodriguez Arbitration, Two Sides Play Hardball\",\n\t    \t\"snippet\": \"In the months since several players were linked to a Florida anti-aging clinic, Major League Baseball and Alex Rodriguez have engaged in a cloak-and-dagger struggle surpassing anything the sport has seen.\",\n\t    \t\"pub_date\": \"2013-11-04T00:00:00Z\",\n\t    \t\"section_name\": \"Sports\",\n\t    \t\"type_of_material\": \"News\"\n\t\t},\n   }\n"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "field": "SearchIdNotFound",
            "optional": false,
            "description": "Search results cannot be found with the id provided."
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "   HTTP/1.1 404 Not Found\n   {\n     \"Search Id Not Found\"\n   }\n"
        }
      ]
    },
    "filename": ".\\dropboxedNews.js"
  }
] });