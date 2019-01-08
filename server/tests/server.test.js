const expect  = require('expect');
const request  = require('supertest');
const {ObjectID} = require('mongodb');


const {app} = require('./../server');
const {todos, populateTodos,users,populateUsers} = require('./seed/seed');
const {Todo} = require('./../models/todo');
const User = require('./../models/user');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST - TODOS', () =>{
    it('should create a new todo', (done) =>{
        var text = 'Test Todo Text';
        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect((response)=>{
                expect(response.body.text).toBe(text); 
            })
            .end((error,response)=>{
                if(error){
                    return done(error);
                }
                Todo.find({text}).then((todos)=>{
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((error)=>{
                    done(error);
                })
            });
    });
    it('Should not create a new todo bad data', (done) =>{
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((error,response)=>{
                if(error){
                    return done(error);
                }
                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((error) => {
                    done(error)
                })  
            });
    })
});

describe('GET todos', () =>{
    it('Should get all todos', (done) =>{
        request(app)
            .get('/todos')
            .expect(200)
            .expect((response)=>{
                expect(response.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('Should return todo doc by id', (done) => {
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((response)=>{
                expect(response.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });
    it('Should return a 404 if todo not found', (done) => {
        var id = new ObjectID().toHexString();
        request(app)
            .get(`/todos/${id}`)
            .expect(404)
            .end(done);
    })
    it('should reuturn 404 for non object ids', (done) => {
        request(app)
            .get(`/todos/123`)
            .expect(404)
            .end(done);
    })
});
describe('DELETE /todos/:id', () => {
    it('Should remove a todo by id', (done) => {
        var id = todos[1]._id.toHexString();
       
        request(app)
            .delete(`/todos/${id}`)
            .expect(200)
            .expect((response) =>{
                expect(response.body.todo._id).toBe(id);
            })
            .end((err,res) => {
                if(err){
                    return done;
                }
                Todo.findById(id).then((result) =>{
                    expect(result).toBeFalsy();
                    done();
                }).catch((err) => done(err));
                   
            });
    });
    it('Should return 404 if todo not found', (done) => {
        var id = new ObjectID().toHexString();
        request(app)
            .delete(`/todos/${id}`)
            .expect(404)
            .end(done);
    });
    it('Should return 404 if objectid is invalid', (done) => {
        request(app)
            .delete(`/todos/123`)
            .expect(404)
            .end(done);
    });
});
describe('PATCH /todos/:id', () => {
    it('Should update the todo', (done) => {
        var id = todos[0]._id.toHexString();
        var text = "text from test";
        request(app)
            .patch(`/todos/${id}`)
            .send({
                completed: true,
                text
            })
            .expect(200)
            .expect((response) => {
                expect(typeof response.body.todo.completedAt).toBe('number');
                expect(response.body.todo.text).toBe(text);
                expect(response.body.todo.completed).toBe(true);
            })
            .end(done); 
    });
    it('Should clear completed at when todo is not completed', (done) => {
        var id = todos[1]._id.toHexString();
        var text = "text from incomplete";
        request(app)
            .patch(`/todos/${id}`)
            .send({
                completed:false,
                text
            })
            .expect(200)
            .expect((response) => {
                expect(response.body.todo.completedAt).toBeFalsy();
                expect(response.body.todo.text).toBe(text);
                expect(response.body.todo.completed).toBe(false);
            })
            .end(done);
    });
});
describe('GET users/me', () =>{
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });
    it('should return a 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});
describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = '123asd';
        request(app)
            .post('/users')
            .send({email,password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body.user.email).toBeTruthy();
                expect(res.body.user._id).toBeTruthy();
            })
            .end((err) => {
                if(err){
                    return done(err);  
                }
                User.findOne({email:email}).then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).toNotBe(password);
                    done();
                }); 
            });

    });
    it('should return validation errors of request invalid', (done) => {

    });
    it('should not create user if email in use', (done) =>{

    });
});