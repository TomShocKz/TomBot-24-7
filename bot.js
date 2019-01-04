// Load up the discord.js library
const Discord = require("discord.js");

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`TomBot a commencé, avec ${client.users.size} utilisateurs, dans ${client.channels.size} channels de ${client.guilds.size} guildes.`); 
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`!help | En ligne sur ${client.guilds.size} serveurs`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`La Latence est ${m.createdTimestamp - message.createdTimestamp}ms. La latence de l'API est ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
  if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
      return message.reply("Désolé, vous n'avez pas les permissions pour l'utiliser!");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Veuillez mentionner un membre valide de ce serveur");
    if(!member.kickable) 
      return message.reply("Je ne peux pas ban cette personne elle a peut être un rôle plus important que le mien?");
    
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "Aucune raison fournie";
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Désolé ${message.author} Je en peux pas le ban à cause de : ${error}`));
    message.reply(`${member.user.tag} a été kick par ${message.author.tag} car: ${reason}`);

  }
  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Désolé, vous n'avez pas les permissions pour l'utiliser!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Veuillez mentionner un membre valide de ce serveur");
    if(!member.bannable) 
      return message.reply("Je ne peux pas ban cette personne elle a peut être un rôle plus important que le mien?");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "Aucune raison fournie";
    
    await member.ban(reason)
      .catch(error => message.reply(`Désolé ${message.author} Je ne peux pas le ban à cause de : ${error}`));
    message.reply(`${member.user.tag} a été banni par ${message.author.tag} car: ${reason}`);
  }
  
  if(command === "clean") {
    // This command removes all messages from all users in the channel, up to 100.
    
    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Veuillez indiquer un nombre compris entre 2 et 100 pour le nombre de messages à supprimer");
    
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Impossible de supprimer les messages en raison de: ${error}`));
  }
  
  if(command === "help"){
    const embed = new Discord.RichEmbed()
  .setTitle("TomBot Commandes, en développement ... !")
  .setAuthor("Auteur | тσм#2316", "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/19/19c29630c7b3f7d0c59efe12398861f139853e5c_full.jpg")
  /*
   * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
   */
  .setColor("#5d13db")
  .setDescription("-  **!help**  :  Pour voir les commandes \n-  **!clean**  :  Pour nettoyer le salon texte ( 100 messages max ) \n-  **!ban**  :  Pour ban des personnes ( temporaire je vais bientôt supprimer cette commande) \n-  **!kick**  :  Pour kick des personnes ( temporaire je vais bientôt supprimer cette commande) \n-  **!ping**  :  Pour voir sa latence (Montre souvent un chiffre élevé)  \n-  **!say**  :  Pour faire parler le bot prend le mot après say et l'écrie\n-  **!time**  Donne le jour le mois l'année et l'heure la minute et la seconde de la journée\n-  **!avatar**  Pour regarder son avatar (image de profil)\n-  **!savatar**  Pour regarder l'avatar du serveur (image du clan)\n-  **!ball**  < question > Tout ce que vous devez savoir\n-  **!ppc**  < Pierre/Papier/Ciseaux > Tenter de gagner contre le Bot  ")
  .setFooter("Créateur --> @| тσм#2316, Tout droit réservé, Copyright © 2018 TomBot", "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/19/19c29630c7b3f7d0c59efe12398861f139853e5c_full.jpg")
  .setImage("https://media.giphy.com/media/IBnixilSdZiCs/giphy.gif")
  .setThumbnail("https://cdn.dribbble.com/users/37530/screenshots/2937858/drib_blink_bot.gif")
    /*
   * Takes a Date object, defaults to current date.
   */
  .setTimestamp()
  .setURL("http://steamcommunity.com/profiles/76561198241472390/")
  .addField("Information au sujet du Bot .",
    "-  Bot crée le 01/06/2018 \n-  Nom réel du bot : T0oWz_// ")
  /*
   * Inline fields may not display as inline if the thumbnail and/or image is too big.
   */
  .addField("Les mises à jour ...", "Nouvelle commandes : (avatar,time,ppc,ball,savatar,restart) et 2 commandes cachées ʕʘ̅͜ʘ̅ʔ", true)
  /*
   * Blank field, useful to create some space.
   */
  .addBlankField(true)
  .addField("Les bugs", "En cas de bug, merci de contacter le créateur.", true);

  message.channel.send({embed});
  };
  
  if(command === "time"){
    var today = new Date()
let Day = today.toString().split(" ")[0].concat("day");
let Month = today.toString().split(" ")[1]
let Year = today.toString().split(" ")[3]
message.channel.send(`\`${Day}\` \`${Month}\` \`${Year}\`\n\`Moment de la journée:\` \`${today.toString().split(" ")[4]}\``)
  }

  if(command === "avatar"){
    let member = message.mentions.members.first() || message.guild.members.get(args[0]) || message.author;

/* Creating the embed */
let embed = new Discord.RichEmbed() 
	.setTitle(member.tag + '\' avatar')
	.setImage(member.avatarURL);

/* Sending the embed */
message.channel.send({embed})
    
  };

  function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
  if(command === "ball"){
    var rnd = randomIntInc(1, 5);
    if (rnd === 1) {
        message.reply("Non");
    } else if (rnd === 2) {
        message.reply("Surement Pas");
    } else if (rnd === 3) {
        message.reply("Peut être");
    } else if (rnd === 4) {
        message.reply("Probablement");
    } else if (rnd === 5) {
        message.reply("Oui");
    }
  }
  if(command === "ppc"){
  var rnd = randomIntInc(1, 3);
  if (rnd === 1) {
      message.reply("Pierre !");
  } else if (rnd === 2) {
      message.reply("Papier !");
  } else if (rnd === 3) {
      message.reply("Ciseaux !");
  }
}    

if(command === "restart"){
  resetBot(message.channel);
  function resetBot(channel) {
      message.react('✅')
          .then(message => client.destroy())
          .then(() => client.login(config.token));
      message.channel.send("``TomBot a correctement redémarré ``")
  }
}

if (command === "pickles") {
  var count = 1; // Number of messages sent (modified by sendSpamMessage)
  var maxMessages = 50; // Change based on how many messages you want sent

  function sendSpamMessage() {
    try {
      // You could modify this to send a random string from an array (ex. a quote), create a
      // random sentence by pulling words from a dictionary file, or to just send a random
      // arrangement of characters and integers. Doing something like this may help prevent
      // future bots from detecting that you sent a spam message.
      message.channel.send("i'm pickle rick #" + count);

      if (count < maxMessages) {
        // If you don't care about whether the messages are deleted or not, like if you created a dedicated server
        // channel just for bot spamming, you can remove the below line and the entire prune command.
        message.channel.send("im a banana im a banana look at me !");
        count++;

        /* These numbers are good for if you want the messages to be deleted.
         * I've also noticed that Discord pauses for about 4 seconds after you send 9
         * messages in rapid succession, and this prevents that. I rarely have any spam
         * messages slip through unless there is a level up from mee6 or Tatsumaki. */
        let minTime = Math.ceil(2112);  // Rush RP1
        let maxTime = Math.floor(3779); // Arbitrary integer
        let timeToWait = Math.floor(Math.random() * (maxTime - minTime)) + minTime;
        setTimeout(sendSpamMessage, timeToWait);
      } else {
        // Sends a message when count is equal to maxMessages. Else statement can be
        // modified/removed without consequence.
        message.channel.send("------------------");
        message.channel.send("I AM FINISHED!!!");
        message.channel.send("------------------");
      }
    } catch (error) {
      sendSpamMessage();
    }
  }

  message.delete().catch(O_o=>{})
  sendSpamMessage();
}

if (command === "prune") {
  message.channel.fetchMessages()
  .then(messages => {
    let message_array = messages.array();
    message_array.length = 2;
    message_array.map(msg => msg.delete().catch(O_o => {}));
   });
}

if(command === "sinfo"){
  let online = message.guild.members.filter(member => member.user.presence.status !== 'offline');
  let day = message.guild.createdAt.getDate()
  let month = 1 + message.guild.createdAt.getMonth()
  let year = message.guild.createdAt.getFullYear()
   let sicon = message.guild.iconURL;
   let serverembed = new Discord.RichEmbed()
   .setAuthor(message.guild.name, sicon)
   .setFooter(`Server Created • ${day}.${month}.${year}`)
   .setColor("#7289DA")
   .setThumbnail(sicon)
   .addField("ID", message.guild.id, true)
   .addField("Name", message.guild.name, true)
   .addField("Owner", message.guild.owner.user.tag, true)
   .addField("Region", message.guild.region, true)
   .addField("Channels", message.guild.channels.size, true)
   .addField("Members", message.guild.memberCount, true)
   .addField("Humans", message.guild.memberCount - message.guild.members.filter(m => m.user.bot).size, true)
   .addField("Bots", message.guild.members.filter(m => m.user.bot).size, true)
   .addField("Online", online.size, true)
   .addField("Roles", message.guild.roles.size, true);
   message.channel.send(serverembed);

};

if(command === "savatar"){
  let member = message.mentions.members.first() || message.guild.members.get(args[0]) || message.author;
  let sicon = message.guild.iconURL;
/* Creating the embed */
let embed = new Discord.RichEmbed() 
.setTitle(message.guild.name, true)
.setImage(sicon);

/* Sending the embed */
message.channel.send({embed})

}





});

client.login(config.token);
          
