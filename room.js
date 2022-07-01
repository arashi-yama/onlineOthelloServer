class Room{
  constructor(roomname,username,userId,pass,id){
    this.roomname=roomname
    this.users=[{
      username,
      userId,
    }]
    this.pass=pass
    this.history=[]
    this.id=id
  }

  addUser(user){
    this.users.push(user)
    return this
  }

  addHistory(his){
    this.history.push(his)
  }

}

exports.Room=Room

