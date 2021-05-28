# CTR_Switch_Bot

This repository contains the source code of the bot used in CTR Competive Switch discord server.

A discord bot which helps in the discord server with the organization of rankeds for the game Crash Team Racing. It has some features like:
  - Set the time of a match in different timezones.
  - Set your player name.
  - Set your country flag.

Also it is possible to create differents kind of libbies like ffa, duos, 3vs3, 4vs4 and itemless.

A part of helping with the organization, it has some interesting commands or utilities:
  - The bot will give the welcome to the new members.
  - The bot has a list of jokes in different languages

To make this bot run you will need:
  - Config the mongoDB, create a new data base and change the url connection to yours .
  - Insert in the mongoDB ParametersSchema collection the documment with fields name = <your login token bot> and description = "loginToken"
  - Install nodejs

  
  
# How to use
  

To create a new lobby it is possible to do with the command !l or !lobby
  
  ![image](https://user-images.githubusercontent.com/51484718/120018323-4b809280-bfe7-11eb-88ab-b88dc43c57ab.png)


When the bot tells you the lobby is already created you can search it in the channel rankeds-lobbies and if you react to the green check box the bot will automatically add you to the message.
  
  ![image](https://user-images.githubusercontent.com/51484718/120018438-72d75f80-bfe7-11eb-952a-cd322876b2ce.png)
