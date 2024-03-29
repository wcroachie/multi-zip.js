very very very barebones no dependencies cross platform zip library i made in the span of like a week. this library in particular leverages the seldom-used multi-volume feature of pkzip format. the user may provide a "max volume size" value to split the resulting archive into multiple files. the benefit for this being, splitting up large files to be downloaded in environments with limited blob storage, such as on smartphones.

it functions as a backup option in case my disk writer library doesn't work or if the browser does not support or allow service workers to intercept requests with content-disposition headers.

no compression, strictly for downloading multiple files.
