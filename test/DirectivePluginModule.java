package test;

import java.util.*;
import com.google.inject.AbstractModule;
import com.google.inject.multibindings.Multibinder;
import com.google.template.soy.shared.restricted.SoyPrintDirective;

public class DirectivePluginModule extends AbstractModule {
	
	@Override protected void configure() {

	    Multibinder<SoyPrintDirective> soyDirectivesSetBinder =
	        Multibinder.newSetBinder(binder(), SoyPrintDirective.class);
	    soyDirectivesSetBinder.addBinding().to(DirectivePlugin.class);

	}

}