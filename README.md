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
  
  ![image](https://user-images.githubusercontent.com/51484718/120018536-9a2e2c80-bfe7-11eb-8a40-6e808119e792.png)
  
  
  
  
Max players per lobby are 8 but depending on the kind of lobby it could be 6
  
  ![image](https://user-images.githubusercontent.com/51484718/120018917-132d8400-bfe8-11eb-8b3a-f7b98e879539.png)

  
  
  
Also duos lobbies, 3vs3 and 4vs4 are aviable
  
  ![image](https://user-images.githubusercontent.com/51484718/120018991-2dfff880-bfe8-11eb-9958-621dd580ad08.png)


  
  
With the command !help the bot will send you the manual of all the commands and a few examples of how to use all of them. There are 20 commands in total. 
  
  ![image](https://user-images.githubusercontent.com/51484718/120019227-78817500-bfe8-11eb-9a86-928668eb34b5.png)
