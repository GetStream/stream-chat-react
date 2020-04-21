Any component can be made a consumer of ChatContext by using function `withChannelContext`.

e.g.,

```json

const DemoComponentWithChannelContext =  withChannelContext(DemoComponent);

class DemoComponent extends React.Component {
    render() {
        return (
            <div>
                This is demo component with channel context
                Name of current user is: {this.props.client.user.name}
            </div>
        )
    }
}

```
