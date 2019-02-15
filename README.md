# html-build [![NPM version](https://badge.fury.io/js/html-build.png)](http://badge.fury.io/js/html-build)

Utility script to build HTML documents - Appends scripts and styles, removes debug parts, append HTML partials, template options, etc.

## Installation

Install this script as a dev dependency.

```bash
$ npm install html-build --save-dev
```

## Usage

### CLI

Add your build script to your `package.json` `scripts`:

```json
{
    //...
    "scripts": {
        "build-html": "html-build -c config.js index.html samples/"
    }
    //...
}
```

Create a configuration file ([more informations][doc-options]):

```javascript
module.exports = {
    beautify: true,
    prefix: "//some-cdn",
    relative: true,
    basePath: false,
    scripts: {
        bundle: [
            "scripts/*.js",
            "!**/main.js",
        ],
        main: "scripts/main.js"
    },
    styles: {
        bundle: [
            "css/libs.css",
            "css/dev.css"
        ],
        test: "css/inline.css"
    },
    sections: {
        views: "views/**/*.html",
        templates: "templates/**/*.html",
        layout: {
            header: "layout/header.html",
            footer: "layout/footer.html"
        }
    },
    data: {
        // Data to pass to templates
        version: "0.1.0",
        title: "test",
    }
};
```

Then run your script:

```bash
$ npm run build-html
```

### Programmatically

```javascript
var htmlBuild = require("html-build");
htmlBuild.build("index.html", "samples/", { /* config */ });
```

## Exemple

Using the configuration above, consider the following example html to see it in action:

```html
<html>
<head>
    <title>grunt-html-build - Test Page</title>
    <!-- build:style bundle -->
    <link rel="stylesheet" type="text/css" href="/path/to/css/dev.css" />
    <!-- /build -->
    <!-- build:style inline test -->
    <link rel="stylesheet" type="text/css" href="/path/to/css/dev-inline.css" />
    <!-- /build -->
</head>
<body id="landing-page">
    <!-- build:section layout.header -->
    <!-- /build -->

    <!-- build:section recursive views -->
    <!-- /build -->

    <!-- build:section layout.footer -->
    <!-- /build -->

    <!-- build:remove -->
    <script type="text/javascript" src="/path/to/js/only-dev.js"></script>
    <!-- /build -->
    
    <!-- build:remove dev -->
    <script type="text/javascript" src="/path/analytics.js"></script>
    <!-- /build -->

    <!-- build:script bundle -->
    <script type="text/javascript" src="/path/to/js/libs/jquery.js"></script>
    <script type="text/javascript" src="/path/to/js/libs/knockout.js"></script>
    <script type="text/javascript" src="/path/to/js/libs/underscore.js"></script>
    <script type="text/javascript" src="/path/to/js/app/module1.js"></script>
    <script type="text/javascript" src="/path/to/js/app/module2.js"></script>
    <!-- /build -->
    <!-- build:process -->
    <script type="text/javascript">
        var version = "<%= version %>",
            title = "<%= title %>";
    </script>
    <!-- /build -->
    <!-- build:script inline main -->
    <script type="text/javascript">
        main();
    </script>
    <!-- /build -->
    <!-- build:script inline noprocess main -->
    <script type="text/javascript">
        main();
    </script>
    <!-- /build -->

    <!-- build:section optional test -->
    <!-- /build -->
</body>
</html>
```

After running the grunt task it will be stored on the samples folder as

```html
<html>
    <head>
        <title>grunt-html-build - Test Page</title>
        <link type="text/css" rel="stylesheet" href="../fixtures/css/libs.css" />
        <link type="text/css" rel="stylesheet" href="../fixtures/css/dev.css" />
        <style>
            .this-is-inline {
                font-weight: bold;
            }
        </style>
    </head>
    <body id="landing-page">
        <header>...</header>
        <div id="view1">...</div>
        <div id="view2">...</div>
        <div id="view3">...</div>
        <footer>...</footer>
        <script type="text/javascript" src="/path/analytics.js"></script>
        <script type="text/javascript" src="../fixtures/scripts/app.js"></script>
        <script type="text/javascript" src="../fixtures/scripts/libs.js"></script>
        <script type="text/javascript">
            var version = "0.1.0",
                title = "test";
        </script>

        <script type="text/javascript">
            var version = "0.1.0";
            productionMain();
        </script>
        <script type="text/javascript">
            var version = "<%= version %>";
            productionMain();
        </script>
    </body>
</html>
```

## Processors

There 5 types of processors:

 * [script][doc-scripts-styles]
    * append script reference from configuration to dest file.
 * [style][doc-scripts-styles]
    * append style reference from configuration to dest file.
 * [section][doc-sections]
    * append partials from configuration to dest file.
 * [process][doc-process]
    * process grunt template on the block.
 * [remove][doc-remove]
    * it will erase the whole block.

[doc-options]: https://github.com/spatools/html-build/wiki/Task-Options
[doc-scripts-styles]: https://github.com/spatools/html-build/wiki/Linking-Scripts-and-Styles
[doc-sections]: https://github.com/spatools/html-build/wiki/Creating-HTML-Sections
[doc-process]: https://github.com/spatools/html-build/wiki/Using-HTML-as-Template
[doc-remove]: https://github.com/spatools/html-build/wiki/Removing-parts
[doc-reuse]: https://github.com/spatools/html-build/wiki/Creating-reusable-HTML-Layout-Template

## Release History

* 0.1.0 Initial Release
