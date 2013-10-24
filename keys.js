function retrieveKeys(source)
{
	var dropBox = "YOUR API KEY GOES HERE!";
	var guardian = "YOUR API KEY GOES HERE!";
	var newYorkTimes = "YOUR API KEY GOES HERE!";
	var key;

	switch(source)
	{
		case "dropbox":
			key = dropBox;
			break;
		case "nyt":
			key = newYorkTimes;
			break;
		case "guardian":
			key = guardian;
			break;
	}

	return key;
}
