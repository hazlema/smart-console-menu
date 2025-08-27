#!/usr/bin/env node
/**************************************************************
  * Professional DevOps management with smart-console-menu
  *
  * Features demonstrated:
  * ✅ Complex deployment workflows
  * ✅ Database management operations
  * ✅ Comprehensive debugging tools
  *************************************************************/

import SmartConsoleMenu from '../lib/console-smart.js';
import ConfigManager from '../lib/console-config.js';

const config = new ConfigManager('./devops-config.json');
config.loadEnvFile('.env.production');

const devOpsMenu = {
    root: [
        ["🚀 Deployment", "menu", "deployMenu"],
        ["💾 Database", "menu", "databaseMenu"],
        ["📊 Monitoring", "menu", "monitorMenu"],
        ["🐛 Debug Tools", "menu", "debugMenu"],
        ["Quit", "exec", "quit"]
    ],
    
    deployMenu: [
        ["Deploy to Production", "exec", "ssh ${username}@${prodServer} 'cd /app && git pull && npm install && pm2 restart app'"],
        ["Deploy to Staging", "exec", "ssh ${username}@${stagingServer} 'cd /app && git pull && npm install && pm2 restart app'"],
        ["Check Deployment Status", "exec", "ssh ${username}@${server} 'pm2 status'"],
        ["View Application Logs", "exec", "ssh ${username}@${server} 'pm2 logs ${appName} --lines 50'"],
        ["Rollback Deployment", "exec", "ssh ${username}@${server} 'cd /app && git reset --hard ${commitHash} && pm2 restart app'"],
    ],
    
    databaseMenu: [
        ["Create Backup", "exec", "ssh ${username}@${dbServer} 'mysqldump -u ${dbUser} -p ${database} > /backups/backup-$(date +%Y%m%d-%H%M%S).sql'"],
        ["Restore from Backup", "exec", "ssh ${username}@${dbServer} 'mysql -u ${dbUser} -p ${database} < ${backupFile}'"],
        ["Run Migration", "exec", "ssh ${username}@${server} 'cd /app && npm run migrate'"],
        ["Connect to Database", "exec", "ssh ${username}@${dbServer} 'mysql -u ${dbUser} -p ${database}'"],
        ["Check Database Status", "exec", "ssh ${username}@${dbServer} 'systemctl status mysql'"],
    ],
    
    monitorMenu: [
        ["Server Health Check", "exec", "ssh ${username}@${server} 'df -h && free -h && uptime'"],
        ["Check Service Status", "exec", "ssh ${username}@${server} 'systemctl status ${serviceName}'"],
        ["View Error Logs", "exec", "ssh ${username}@${server} 'tail -f /var/log/${logFile}'"],
        ["Monitor Network", "exec", "ping -c 5 ${server}"],
        ["Check SSL Certificate", "exec", "openssl s_client -connect ${domain}:443 -servername ${domain} < /dev/null 2>/dev/null | openssl x509 -noout -dates"],
    ],
    
    debugMenu: [
        ["🐛 Show All Variables", "debug", "vars"],
        ["🐛 Show Environment", "debug", "env"],
        ["🐛 Show Configuration", "debug", "config"],
        ["🐛 Show Menu Structure", "debug", "menu"],
        ["🐛 Complete Debug Info", "debug", "all"],
    ]
};

new SmartConsoleMenu(devOpsMenu, config).start().catch(console.error);
