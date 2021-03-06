# jQuery Picasa Plugin

This jQuery plugin is designed to simplify the access to Google's Picasa image 
gallery. 

## Usage

Add these two scripts:

    <!-- Specify jQuery however you like. -->
    <script type="text/javascript" src="jquery.js"></script>
    <script type="text/javascript" src="js/jquery.picasa.js"></script>


Add this stylesheet:

    <!-- Optional. -->
    <link rel="stylesheet" type="text/css" href="css/jquery.picasa.css" media="screen" />

Add this to the body:

    <div id="picasa-gallery">
    </div>

Simple example to retrieve all albums:

    var userId = "YOUR_USER_ID";
    $('#picasa-gallery').picasa('gallery', userId);

Simple example to retrieve all images for a specified album:

    var userId = "YOUR_USER_ID";
    var albumId = "YOUR_ALBUM_ID";
    $('#picasa-gallery').picasa('gallery', userId, albumId);


## License

Under the same licenses as the jQuery library itself: <http://docs.jquery.com/License>

## Credits

jQuery picasa is made by Michael West

I got the idea from Lance Pollard who did an excellent job. <http://code.lancepollard.com/picasa-jquery-plugin>
