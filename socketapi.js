const io = require("socket.io")();
const userModel = require('./routes/users');
const msgModel = require('./routes/msgs');
const groupModel = require('./routes/groups')
const socketapi = {
    io: io
};

// Add your socket.io logic here!
io.on("connection", function (socket) {
    // console.log(socket.id)
    console.log("A user connected");

    socket.on("join-server", async (userDetails)=>{
        const currentUser = await userModel.findOne({
            username: userDetails.username,
        })

        const allGroups = await groupModel.find({
            users: {
                $in: [currentUser._id],
            }
        })
        allGroups.forEach((group)=>{
            socket.emit('joined-group', group)
        })

        const onlineUsers = await userModel.find({
            socketId: { $nin: [""] },
            username: { $nin: [currentUser.username] },
        })
        // console.log(onlineUsers)
        onlineUsers.forEach((onlineUser)=>{
            socket.emit("newUserJoined", {
                profileImage: onlineUser.profileImage,
                username: onlineUser.username,
            })
        })

        socket.broadcast.emit("newUserJoined", {
            profileImage: currentUser.profileImage,
            username: currentUser.username,
        })

        currentUser.socketId = socket.id;
        await currentUser.save();      
    })

    socket.on("disconnect", async ()=>{
        // console.log(socket.id);
        await userModel.findOneAndUpdate(
            {socketId: socket.id}, 
            {socketId: ''}, 
            // {new: true},
        )
    })

    socket.on("privateMessage", async (msg)=>{
        // console.log(msg);
        await msgModel.create({
            msg: msg.msg,
            reciver: msg.reciver,     
            sender: msg.sender, 
        })
        const reciver = await userModel.findOne({
            username: msg.reciver,
        })
        if(!reciver){
            /* jab reciver nahi milega */
            const group = await groupModel.findOne({
                name: msg.reciver,
            }).populate("users");
            
            group.users.forEach((user)=>{
                socket.to(user.socketId).emit("recivePrivateMessage", msg)
            })

            if(!group){
                return   /* jab group nahi milega */
            }
        }

        if(reciver){
            io.to(reciver.socketId).emit("recivePrivateMessage", msg)
        }
    })

    socket.on('getMessage', async (msg)=>{
        const reciver = await userModel.findOne({
            username: msg.reciver,
        })
        // console.log(reciver);

        if(reciver){
            const allMessages = await msgModel.find({
                $or: [
                    {
                        sender: msg.sender,
                        reciver: msg.reciver,
                    },
                    {
                        reciver: msg.sender,
                        sender: msg.reciver,
                    },
                ]
           })
           
           socket.emit('chatMessages', allMessages)
        }
        else{
            const group = await groupModel.findOne({
                name: msg.reciver,
            })
            const allMessages = await msgModel.find({
               reciver: msg.reciver, 
            })

            socket.emit('chatMessages', allMessages)
        }
       
    })

    socket.on('create-new-group', async (groupDetails)=>{
        // console.log(groupDetails);
        const group = await groupModel.create({
            name: groupDetails.groupName,
        })
        const loggedInUser = await userModel.findOne({
            username: groupDetails.sender,
        })
        group.users.push(loggedInUser._id);
        await group.save();

        socket.emit('created-group', group)
    })

    socket.on('join-group', async (joingroupDetails)=>{
        // console.log(joingroupDetails);
        const group = await groupModel.findOne({
            name: joingroupDetails.groupName,
        })
        const loggedInUser = await userModel.findOne({
            username: joingroupDetails.sender,
        })
        group.users.push(loggedInUser._id);
        await group.save();

        socket.emit('joined-group', {
            profileImage: group.profileImage,
            name: group.name,
        })
    })
});
// end of socket.io logic

module.exports = socketapi;