<?php

ini_set("display_errors", 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$postdata = trim(file_get_contents("php://input"));

$request = json_decode($postdata);
$file_name = './' .  $request->fname_post;
$subject_results = $request->results_post;

$outcome = file_put_contents($file_name, $subject_results, FILE_APPEND);

if ($outcome > 5 AND substr($file_name, -4) === ".txt") {
    echo "https://app.prolific.co/submissions/complete?cc=CLRTE8EZ";
} else {
    if (is_file($file_name) === FALSE) {
        echo "Failed to save file " . $file_name . "! Please do not close this page, but contact lkcsgaspar@gmail.com! (" . $outcome . ")";
    } else if ($outcome > 5) {
        echo "Failed to save file due to incorrect data! Please do not close this page, but contact lkcsgaspar@gmail.com! (" . $file_name . ")";
    } else {
        echo "Failed to properly save file " . $file_name . "! Please do not close this page, but contact lkcsgaspar@gmail.com! (" . $outcome . ")";
    }
}

?>
