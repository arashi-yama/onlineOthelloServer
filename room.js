class Room{
  constructor(roomname,username,userId,pass){
    this.roomname=roomname
    this.users=[{
      username,
      userId,
    }]
    this.pass=pass
    this.history=[]
  }

  addUser(user){
    this.users.push(user)
    return this
  }

  addHistory(his){
    this.history.push(his)
  }

}

class Rooms extends Map{
  constructor(oldestId){
    super()
    this.oldestId=oldestId
    this.nextId=oldestId+1
  }
  add(value){
    super.set(this.nextId,value)
    this.oldestId++
    this.nextId++
  }
  findKey(fun){
    const entries=this.entries()
    for(const [key,value] of entries){
      if(fun(value))return key
    }
  }
}

module.exports={
  Room,Rooms
}