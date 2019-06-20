const token = "NTkxMjY5NDI1NDI1MDIzMDAz.XQuUnw.SZGysib9F5qcm7PjhwwC1JEraxM";
const prefix = ">"

const Discord = require('discord.js');

const client = new Discord.Client();


client.on('message', message => {

    const guild = message.member.guild;

    if (message.author.id !== '118098246655672329') {
        if (guild.disabled) return;

        if (message.author.bot) return;
    
        if (message.member._roles.length === 0) return; 
    
        if (!message.content.startsWith(prefix)) return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (!commands[command]) return;

    commands[command](guild, message, args, msg => {
        console.log(msg);
        if (!msg) return;
        message.channel.send(msg);
    });

})

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const commands = {
    split: (guild, message, args, callback) => {

        if (!guild.targetA || !guild.targetB) return callback("You need to set both target channels");

        if (!message.member.voiceChannelID) return callback("You are not in a voice channel");

        const channel = guild.channels.find(channel => channel.id === message.member.voiceChannelID);

        if (args[0] && args[0].startsWith('cap')) {
            commands.captains(guild, message, [], (string, capA, capB) => {
                capA.setVoiceChannel(guild.targetA.id);
                capB.setVoiceChannel(guild.targetB.id);               
                callback(string)
            })
        }
        const lockedMembers = [...channel.members.filter(member => !member.user.bot)];
        shuffle(lockedMembers);
        const redTeamNames = [];
        const blueTeamNames = [];

        for (let i = 0; i < lockedMembers.length; i+=2) {
            lockedMembers[i][1].setVoiceChannel(guild.targetA.id);
            redTeamNames.push(lockedMembers[i][1].nickname || lockedMembers[i][1].user.username);
            if (lockedMembers[i+1]) {
                lockedMembers[i+1][1].setVoiceChannel(guild.targetB.id);
                blueTeamNames.push(lockedMembers[i+1][1].nickname || lockedMembers[i+1][1].user.username);
            } 
        }

        let callbackString = '```css\nThe teams are:\n' + ''.padStart(120,'_') + '\n\n';
        for (let i = 0; i < redTeamNames.length; i++) {
            callbackString += `[${redTeamNames[i].replace('[','(').replace(']',')')}]`.padEnd(70,' ');
            if (blueTeamNames[i]) callbackString += `.${blueTeamNames[i].replace(' ','-').replace('[','(').replace(']',')')}`;
            callbackString += '\n';
        }
        callbackString += '```';

        if (args[1] === 'redo') {
            args[2].edit(callbackString);
            const filter = (reaction, user) => reaction.emoji.name === '🔁' && user.id === message.author.id;
            const collector = args[2].createReactionCollector(filter, { time: 20000 })
            collector.on('collect', () => {
                commands.gather(guild, message, [], () => {
                    commands.split(guild, message, [...args, 'redo', args[2]]);
                })
                collector.stop();
            })
        } else {
            message.channel.send(callbackString)
            .then(msg => {
                msg.react('🔁');
                const filter = (reaction, user) => reaction.emoji.name === '🔁' && user.id === message.author.id;
                const collector = msg.createReactionCollector(filter, { time: 20000 })
                collector.on('collect', () => {
                    commands.gather(guild, message, [], () => {
                        console.log('test');
                        commands.split(guild, message, [args[0], 'redo', msg]);
                    })
                    collector.stop();
                })
            });
        }
    },

    captains: (guild, message, args, callback) => {
        if (!message.member.voiceChannelID) return callback("You are not in a voice channel");

        const channel = guild.channels.find(channel => channel.id === message.member.voiceChannelID);
        
        const lockedMembers = [...channel.members]
        shuffle(lockedMembers);

        const [captainOne, captainTwo] = lockedMembers;
        
        callback(`Captains are ${captainOne[1].nickname || captainOne[1].user.username} and ${captainTwo[1].nickname || captainTwo[1].user.username}`, captainOne, captainTwo);
    },

    gather: (guild, message, args, callback) => {
        let argChannelId = null;
        if(args.length > 0) {
            const channelName = args.join(' ').toLowerCase('').trim();
            const channel = guild.channels.find(channel =>  channel.type === 'voice' && channel.name.toLowerCase() === channelName);
            if (channel) argChannelId = channel.id;
        }
        
        if (!message.member.voiceChannelID) return callback("You are not in a voice channel");

        const targetId = argChannelId || message.member.voiceChannelID;

        guild.channels.filter(channel => channel.type === 'voice' && (channel.joinable && channel.id !== targetId)).forEach(channel => {
            channel.members.forEach(member => member.setVoiceChannel(targetId));
        })

        setTimeout(callback, 2000);
    },

    set: (guild, message, args, callback) => {
        const [type, channelA, channelB] = args.map(arg => arg.toLowerCase());

        console.log(type);
        if (type === 'captain') {
            if(!channelA) return callback('You need to specify a channel');
            const channels = guild.channels.filter(channel => channel.type === 'voice');
            guild.captainChannel = channels.find(channel => channel.name.replace(' ','').toLowerCase() === channelA);
            callback((guild.captainChannel) ? `Channel set to ${guild.captainChannel.name}` : `Could not find channel ${channelA}`);
        } else if(type === 'split') {
            if(!channelA || !channelB) return callback('You need to specify both channels');
            const channels = guild.channels.filter(channel => channel.type === 'voice');
            guild.targetA = channels.find(channel => channel.name.replace(' ','').toLowerCase() === channelA);
            guild.targetB = channels.find(channel => channel.name.replace(' ','').toLowerCase() === channelB);
            let callbackString = '';
            callbackString += (guild.targetA) ? 'Set target A to channel ' + guild.targetA.name : 'Could not find channel ' + channelA;
            callbackString += ', '
            callbackString += (guild.targetB) ? 'Set target B to channel ' + guild.targetB.name : 'Could not find channel ' + channelB;
            callback(callbackString); 
        } else {
            callback("You need to specify what you are setting: `>set split channelA channelB`, see `>help set` for more info.");
        }
    },

    disable: (guild, message, args, callback) => {
        if (message.author.id === '118098246655672329') {
            guild.disabled = !guild.disabled;
            callback(guild.disabled ? 'Bot disabled' : 'Bot enabled');
        }
    },

    fuckentropy: (guild, message, args, callback) => {
        callback("EYY FUCK YOU <@208713421192036352>")
    },

    help: (guild, message, args, callback) => {
        switch (args[0]) {
            case 'captains':
                callback("Pick two random captains\nUsage: ```\n>captains```")
                break;
            case 'split':
                callback("Split everyone in your voice channel into two random teams\nUsage: ```\n>split [captains]\n[captains]: Enter 'captains' if you want captains"+
                         " to be chosed aswell. This is different from >captains because in that command the captains choose the teams```")
                break;
            case 'gather':
                callback("Moves everyone to your channel\nUsage: ```\n>gather [channel]:\n[channel]:"+
                         " The name of the channel you want people to gather to. By default this is the channel that you are in.```")
                break;
            case 'set':
                callback("Sets the target channels\nUsage: ```\n>set [type] [channelA] [channelB]\n[type]: The thing you want to set either 'captain' or 'split'\n"+
                         "[channelA]: For captain type: this is the channel you are setting to the captain channel, for split type this is the first target channel" + 
                         "\n[channelB]: For captain type: nothing, for split type this is the second target channel\n" +
                         "Leave spaces out of the channel names 'The Casuals' becomes 'TheCasuals'```");
                break;
            default:
                callback('This is a bot made by <@118098246655672329> that is able to randomly split up a voice channel. \n' +
                         '```\n>gather: Moves everyone to your channel\n>set: Sets the target channels\n' +
                        '>split: Split everyone in your voice channel into two random teams\n>captains: Pick two random captains\n>fuckentropy: Secret```' + 
                        'See `>help [command]` for help with a specific command');
                break;
        }
    },
}

client.login(token);