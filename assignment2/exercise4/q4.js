import fs from "fs"

const createTodo = (task) => {
    try {
        let todoList = []

        if (fs.existsSync("todo.json")) {
            let data = fs.readFileSync("todo.json", "utf-8")
            if (data) {
                todoList = JSON.parse(data)
            }
        }

        let obj = {
            task: task,
            status: "pending"
        }

        todoList.push(obj)

        fs.writeFileSync("todo.json", JSON.stringify(todoList, null, 2))
        return "Todo created successfully"

    } catch (error) {
        console.log("Error from createTodo", error)
    }
}

const readTodo = () => {
    try {
        let data = fs.readFileSync("todo.json", "utf-8")
        return data
    } catch (error) {
        console.log("Error from readTodo", error)
    }
}

const updateTodo = (index) => {
    try {
        let data = fs.readFileSync("todo.json", "utf-8")
        let todoList = JSON.parse(data)

        todoList[index].status = "completed"

        fs.writeFileSync("todo.json", JSON.stringify(todoList, null, 2))
        return "Todo updated successfully"

    } catch (error) {
        console.log("Error from updateTodo", error)
    }
}

const deleteTodo = (index) => {
    try {
        let data = fs.readFileSync("todo.json", "utf-8")
        let todoList = JSON.parse(data)

        todoList.splice(index, 1)

        fs.writeFileSync("todo.json", JSON.stringify(todoList, null, 2))
        return "Todo deleted successfully"

    } catch (error) {
        console.log("Error from deleteTodo", error)
    }
}

export { createTodo, readTodo, updateTodo, deleteTodo }