package test;

import java.util.*;
import com.google.inject.AbstractModule;
import com.google.template.soy.msgs.SoyMsgPlugin;

public class MsgPluginModule extends AbstractModule {
	
	@Override protected void configure() {

	    bind(SoyMsgPlugin.class).to(MsgPlugin.class);

	}

}