Any component can be made a consumer of ChatContext by using function `withChatContext`.

e.g.,

```json

const DemoComponentWithChatContext =  withChatContext(DemoComponent);

class DemoComponent extends React.Component {
    render() {
        return (
            <div>
                This is demo component with chat context
                Name of current user is: {this.props.client.user.name}
            </div>
        )
    }
}

```
